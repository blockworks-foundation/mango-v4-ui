import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  TransactionInstruction,
  PublicKey,
  VersionedTransaction,
  Connection,
  TransactionMessage,
  AddressLookupTableAccount,
} from '@solana/web3.js'
import Decimal from 'decimal.js'

import mangoStore from '@store/mangoStore'
import RoutesModal from './RoutesModal'
import Button, { IconButton } from '../shared/Button'
import Loading from '../shared/Loading'
import {
  ArrowLeftIcon,
  PencilIcon,
  ArrowsRightLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { formatDecimal, formatFixedDecimals } from '../../utils/numbers'
import { notify } from '../../utils/notifications'
import useJupiterMints from '../../hooks/useJupiterMints'
import { RouteInfo } from 'types/jupiter'
import useJupiterSwapData from './useJupiterSwapData'
// import { Transaction } from '@solana/web3.js'
import { SOUND_SETTINGS_KEY } from 'utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { Howl } from 'howler'
import { INITIAL_SOUND_SETTINGS } from '@components/settings/SoundSettings'
import Tooltip from '@components/shared/Tooltip'
import HealthImpact from '@components/shared/HealthImpact'

type JupiterRouteInfoProps = {
  amountIn: Decimal
  maintProjectedHealth: number
  onClose: () => void
  routes: RouteInfo[] | undefined
  selectedRoute: RouteInfo | undefined
  setSelectedRoute: Dispatch<SetStateAction<RouteInfo | undefined>>
  slippage: number
}

const deserializeJupiterIxAndAlt = async (
  connection: Connection,
  swapTransaction: string
): Promise<[TransactionInstruction[], AddressLookupTableAccount[]]> => {
  const parsedSwapTransaction = VersionedTransaction.deserialize(
    Buffer.from(swapTransaction, 'base64')
  )
  const message = parsedSwapTransaction.message
  // const lookups = message.addressTableLookups
  const addressLookupTablesResponses = await Promise.all(
    message.addressTableLookups.map((alt) =>
      connection.getAddressLookupTable(alt.accountKey)
    )
  )
  const addressLookupTables: AddressLookupTableAccount[] =
    addressLookupTablesResponses
      .map((alt) => alt.value)
      .filter((x): x is AddressLookupTableAccount => x !== null)

  const decompiledMessage = TransactionMessage.decompile(message, {
    addressLookupTableAccounts: addressLookupTables,
  })

  return [decompiledMessage.instructions, addressLookupTables]
}

const fetchJupiterTransaction = async (
  connection: Connection,
  selectedRoute: RouteInfo,
  userPublicKey: PublicKey,
  slippage: number,
  inputMint: PublicKey
): Promise<[TransactionInstruction[], AddressLookupTableAccount[]]> => {
  const transactions = await (
    await fetch('https://quote-api.jup.ag/v4/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // route from /quote api
        route: selectedRoute,
        // user public key to be used for the swap
        userPublicKey,
        // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
        // This is the ATA account for the output token where the fee will be sent to. If you are swapping from SOL->USDC then this would be the USDC ATA you want to collect the fee.
        // feeAccount: 'fee_account_public_key',
        slippageBps: Math.ceil(slippage * 100),
      }),
    })
  ).json()

  const { swapTransaction } = transactions

  const [ixs, alts] = await deserializeJupiterIxAndAlt(
    connection,
    swapTransaction
  )

  const isSetupIx = (pk: PublicKey): boolean =>
    pk.toString() === 'ComputeBudget111111111111111111111111111111' ||
    pk.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

  const isDuplicateAta = (ix: TransactionInstruction): boolean => {
    return (
      ix.programId.toString() ===
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' &&
      ix.keys[3].pubkey.toString() === inputMint.toString()
    )
  }

  const filtered_jup_ixs = ixs.filter(
    (ix) => !isSetupIx(ix.programId) && !isDuplicateAta(ix)
  )
  console.log('ixs: ', ixs)
  console.log('filtered ixs: ', filtered_jup_ixs)

  return [filtered_jup_ixs, alts]
}

const EMPTY_COINGECKO_PRICES = {
  inputCoingeckoPrice: 0,
  outputCoingeckoPrice: 0,
}

const successSound = new Howl({
  src: ['/sounds/swap-success.mp3'],
  volume: 0.5,
})

const SwapReviewRouteInfo = ({
  amountIn,
  maintProjectedHealth,
  onClose,
  routes,
  selectedRoute,
  setSelectedRoute,
}: JupiterRouteInfoProps) => {
  const { t } = useTranslation(['common', 'trade'])
  const [showRoutesModal, setShowRoutesModal] = useState(false)
  const [swapRate, setSwapRate] = useState<boolean>(false)
  const [feeValue] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [coingeckoPrices, setCoingeckoPrices] = useState(EMPTY_COINGECKO_PRICES)
  const { jupiterTokens } = useJupiterMints()
  const { inputTokenInfo, outputTokenInfo } = useJupiterSwapData()
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const [soundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS
  )

  const inputTokenIconUri = useMemo(() => {
    return inputTokenInfo ? inputTokenInfo.logoURI : ''
  }, [inputTokenInfo])

  const amountOut = useMemo(() => {
    if (!selectedRoute || !outputTokenInfo) return
    return new Decimal(selectedRoute.outAmount.toString()).div(
      10 ** outputTokenInfo.decimals
    )
  }, [selectedRoute, outputTokenInfo])

  useEffect(() => {
    setCoingeckoPrices(EMPTY_COINGECKO_PRICES)
    const fetchTokenPrices = async () => {
      const inputId = inputTokenInfo?.extensions?.coingeckoId
      const outputId = outputTokenInfo?.extensions?.coingeckoId

      if (inputId && outputId) {
        const results = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${inputId},${outputId}&vs_currencies=usd`
        )
        const json = await results.json()
        if (json[inputId]?.usd && json[outputId]?.usd) {
          setCoingeckoPrices({
            inputCoingeckoPrice: json[inputId].usd,
            outputCoingeckoPrice: json[outputId].usd,
          })
        }
      }
    }

    if (inputTokenInfo && outputTokenInfo) {
      fetchTokenPrices()
    }
  }, [inputTokenInfo, outputTokenInfo])

  const onSwap = async () => {
    if (!selectedRoute) return
    try {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const inputBank = mangoStore.getState().swap.inputBank
      const outputBank = mangoStore.getState().swap.outputBank
      const slippage = mangoStore.getState().swap.slippage
      const set = mangoStore.getState().set
      const connection = mangoStore.getState().connection

      if (!mangoAccount || !group || !inputBank || !outputBank) return

      const [ixs, alts] = await fetchJupiterTransaction(
        connection,
        selectedRoute,
        mangoAccount.owner,
        slippage,
        inputBank.mint
      )

      try {
        setSubmitting(true)
        const tx = await client.marginTrade({
          group,
          mangoAccount,
          inputMintPk: inputBank.mint,
          amountIn: amountIn.toNumber(),
          outputMintPk: outputBank.mint,
          userDefinedInstructions: ixs,
          userDefinedAlts: alts,
          flashLoanType: { swap: {} },
        })
        set((s) => {
          s.swap.success = true
        })
        if (soundSettings['swap-success']) {
          successSound.play()
        }
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: tx,
          noSound: true,
        })
        actions.fetchGroup()
        await actions.reloadMangoAccount()
      } catch (e: any) {
        console.error('onSwap error: ', e)
        notify({
          title: 'Transaction failed',
          description: e.message,
          txid: e?.txid,
          type: 'error',
        })
      } finally {
        setSubmitting(false)
      }
    } catch (e) {
      console.error('Swap error:', e)
    } finally {
      onClose()
    }
  }

  const [balance, borrowAmount] = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const inputBank = mangoStore.getState().swap.inputBank
    if (!mangoAccount || !inputBank) return [0, 0]

    const balance = mangoAccount.getTokenDepositsUi(inputBank)
    const remainingBalance = balance - amountIn.toNumber()
    const borrowAmount = remainingBalance < 0 ? Math.abs(remainingBalance) : 0

    return [balance, borrowAmount]
  }, [amountIn])

  const coinGeckoPriceDifference = useMemo(() => {
    return amountOut?.toNumber()
      ? amountIn
          .div(amountOut)
          .minus(
            new Decimal(coingeckoPrices?.outputCoingeckoPrice).div(
              coingeckoPrices?.inputCoingeckoPrice
            )
          )
          .div(amountIn.div(amountOut))
          .mul(100)
      : new Decimal(0)
  }, [coingeckoPrices, amountIn, amountOut])

  return routes?.length && selectedRoute && outputTokenInfo && amountOut ? (
    <div className="flex h-full flex-col justify-between">
      <div>
        <IconButton
          className="absolute top-4 left-4 mr-3 text-th-fgd-2"
          onClick={onClose}
          size="small"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </IconButton>
        <div className="flex justify-center bg-gradient-to-t from-th-bkg-1 to-th-bkg-2 p-6 pb-0">
          <div className="mb-4 flex w-full flex-col items-center border-b border-th-bkg-3 pb-4">
            <div className="relative mb-2 w-[72px]">
              <Image alt="" width="40" height="40" src={inputTokenIconUri} />
              <div className="absolute right-0 top-0">
                <Image
                  className="drop-shadow-md"
                  alt=""
                  width="40"
                  height="40"
                  src={outputTokenInfo.logoURI}
                />
              </div>
            </div>
            <p className="mb-0.5 flex items-center text-center text-lg">
              <span className="mr-1 font-mono text-th-fgd-1">{`${formatFixedDecimals(
                amountIn.toNumber()
              )}`}</span>{' '}
              {inputTokenInfo!.symbol}
              <ArrowRightIcon className="mx-2 h-5 w-5 text-th-fgd-4" />
              <span className="mr-1 font-mono text-th-fgd-1">{`${formatFixedDecimals(
                amountOut.toNumber()
              )}`}</span>{' '}
              {`${outputTokenInfo.symbol}`}
            </p>
          </div>
        </div>
        <div className="space-y-2 px-6">
          <div className="flex justify-between">
            <p className="text-sm text-th-fgd-3">{t('swap:rate')}</p>
            <div>
              <div className="flex items-center justify-end">
                <p className="text-right font-mono text-sm text-th-fgd-2">
                  {swapRate ? (
                    <>
                      1{' '}
                      <span className="font-body tracking-wide">
                        {inputTokenInfo!.name} ≈{' '}
                      </span>
                      {formatFixedDecimals(amountOut.div(amountIn).toNumber())}{' '}
                      <span className="font-body tracking-wide">
                        {outputTokenInfo?.symbol}
                      </span>
                    </>
                  ) : (
                    <>
                      1{' '}
                      <span className="font-body tracking-wide">
                        {outputTokenInfo?.symbol} ≈{' '}
                      </span>
                      {formatFixedDecimals(amountIn.div(amountOut).toNumber())}{' '}
                      <span className="font-body tracking-wide">
                        {inputTokenInfo!.symbol}
                      </span>
                    </>
                  )}
                </p>
                <ArrowsRightLeftIcon
                  className="default-transition ml-1 h-4 w-4 cursor-pointer text-th-fgd-2 hover:text-th-active"
                  onClick={() => setSwapRate(!swapRate)}
                />
              </div>
              <div className="space-y-2 px-1 text-xs">
                {coingeckoPrices?.outputCoingeckoPrice &&
                coingeckoPrices?.inputCoingeckoPrice ? (
                  <div
                    className={`text-right font-mono ${
                      coinGeckoPriceDifference.gt(1)
                        ? 'text-th-down'
                        : 'text-th-up'
                    }`}
                  >
                    {Decimal.abs(coinGeckoPriceDifference).toFixed(1)}%{' '}
                    <span className="font-body tracking-wide text-th-fgd-3">{`${
                      coinGeckoPriceDifference.lte(0)
                        ? 'cheaper'
                        : 'more expensive'
                    } than CoinGecko`}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-th-fgd-3">
              {t('swap:minimum-received')}
            </p>
            {outputTokenInfo?.decimals ? (
              <p className="text-right font-mono text-sm text-th-fgd-2">
                {formatDecimal(
                  selectedRoute?.otherAmountThreshold /
                    10 ** outputTokenInfo.decimals || 1,
                  outputTokenInfo.decimals
                )}{' '}
                <span className="font-body tracking-wide">
                  {outputTokenInfo?.symbol}
                </span>
              </p>
            ) : null}
          </div>
          <HealthImpact maintProjectedHealth={maintProjectedHealth} />
          {borrowAmount ? (
            <>
              <div className="flex justify-between">
                <Tooltip
                  content={
                    balance
                      ? t('swap:tooltip-borrow-balance', {
                          balance: formatFixedDecimals(balance),
                          borrowAmount: formatFixedDecimals(borrowAmount),
                          token: inputTokenInfo?.symbol,
                        })
                      : t('swap:tooltip-borrow-no-balance', {
                          borrowAmount: formatFixedDecimals(borrowAmount),
                          token: inputTokenInfo?.symbol,
                        })
                  }
                >
                  <p className="tooltip-underline text-sm text-th-fgd-3">
                    {t('borrow-amount')}
                  </p>
                </Tooltip>
                <p className="text-right font-mono text-sm text-th-fgd-2">
                  ~{formatFixedDecimals(borrowAmount)}{' '}
                  <span className="font-body tracking-wide">
                    {inputTokenInfo?.symbol}
                  </span>
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-th-fgd-3">{t('borrow-fee')}</p>
                <p className="text-right font-mono text-sm text-th-fgd-2">
                  ~
                  {formatFixedDecimals(
                    amountIn
                      .mul(inputBank!.loanOriginationFeeRate.toFixed())
                      .toNumber()
                  )}{' '}
                  <span className="font-body tracking-wide">
                    {inputBank!.name}
                  </span>
                </p>
              </div>
              <div className="flex justify-between">
                <Tooltip content={t('tooltip-borrow-rate')}>
                  <p className="tooltip-underline text-sm text-th-fgd-3">
                    {t('borrow-rate')}
                  </p>
                </Tooltip>
                <p className="text-right font-mono text-sm text-th-down">
                  {formatDecimal(inputBank!.getBorrowRateUi(), 2, {
                    fixed: true,
                  })}
                  %
                </p>
              </div>
            </>
          ) : null}
          <div className="flex justify-between">
            <p className="text-sm text-th-fgd-3">Est. {t('swap:slippage')}</p>
            <p className="text-right font-mono text-sm text-th-fgd-2">
              {selectedRoute?.priceImpactPct * 100 < 0.1
                ? '<0.1%'
                : `${(selectedRoute?.priceImpactPct * 100).toFixed(2)}%`}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-th-fgd-3">Swap Route</p>
            <div
              className="flex items-center text-th-fgd-2 md:hover:cursor-pointer md:hover:text-th-fgd-3"
              role="button"
              onClick={() => setShowRoutesModal(true)}
            >
              <span className="overflow-ellipsis whitespace-nowrap">
                {selectedRoute?.marketInfos.map((info, index) => {
                  let includeSeparator = false
                  if (
                    selectedRoute?.marketInfos.length > 1 &&
                    index !== selectedRoute?.marketInfos.length - 1
                  ) {
                    includeSeparator = true
                  }
                  return (
                    <span key={index}>{`${info?.label} ${
                      includeSeparator ? 'x ' : ''
                    }`}</span>
                  )
                })}
              </span>
              <PencilIcon className="ml-2 h-4 w-4 hover:text-th-active" />
            </div>
          </div>
          {typeof feeValue === 'number' ? (
            <div className="flex justify-between">
              <p className="text-sm text-th-fgd-3">{t('fee')}</p>
              <div className="flex items-center">
                <p className="text-right font-mono text-sm text-th-fgd-2">
                  ≈ ${feeValue?.toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            selectedRoute?.marketInfos.map((info, index) => {
              const feeToken = jupiterTokens.find(
                (item) => item?.address === info.lpFee?.mint
              )
              return (
                <div className="flex justify-between" key={index}>
                  <p className="text-sm text-th-fgd-3">
                    {t('swap:fees-paid-to', {
                      route: info?.label,
                    })}
                  </p>
                  {feeToken?.decimals && (
                    <p className="pl-4 text-right font-mono text-sm text-th-fgd-2">
                      {(
                        info.lpFee?.amount / Math.pow(10, feeToken.decimals)
                      ).toFixed(6)}{' '}
                      <span className="font-body tracking-wide">
                        {feeToken?.symbol}
                      </span>{' '}
                      (
                      {(info.lpFee?.pct * 100).toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}
                      %)
                    </p>
                  )}
                </div>
              )
            })
          )}
          {/* {connected ? (
        <>
          <div className="flex justify-between">
            <span>{t('swap:transaction-fee')}</span>
            <div className="text-right text-th-fgd-2">
              {depositAndFee
                ? depositAndFee?.signatureFee / Math.pow(10, 9)
                : '-'}{' '}
              SOL
            </div>
          </div>
          {depositAndFee?.ataDepositLength ||
          depositAndFee?.openOrdersDeposits?.length ? (
            <div className="flex justify-between">
              <div className="flex items-center">
                <span>{t('deposit')}</span>
                <Tooltip
                  content={
                    <>
                      {depositAndFee?.ataDepositLength ? (
                        <div>{t('need-ata-account')}</div>
                      ) : null}
                      {depositAndFee?.openOrdersDeposits?.length ? (
                        <div className="mt-2">
                          {t('swap:serum-requires-openorders')}{' '}
                          <a
                            href="https://docs.google.com/document/d/1qEWc_Bmc1aAxyCUcilKB4ZYpOu3B0BxIbe__dRYmVns/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('swap:heres-how')}
                          </a>
                        </div>
                      ) : null}
                    </>
                  }
                  placement={'left'}
                >
                  <InformationCircleIcon className="ml-1.5 h-3.5 w-3.5 cursor-help text-th-active" />
                </Tooltip>
              </div>
              <div>
                {depositAndFee?.ataDepositLength ? (
                  <div className="text-right text-th-fgd-2">
                    {depositAndFee?.ataDepositLength === 1
                      ? t('swap:ata-deposit-details', {
                          cost: (
                            depositAndFee?.ataDeposit / Math.pow(10, 9)
                          ).toFixed(5),
                          count: depositAndFee?.ataDepositLength,
                        })
                      : t('swap:ata-deposit-details_plural', {
                          cost: (
                            depositAndFee?.ataDeposit / Math.pow(10, 9)
                          ).toFixed(5),
                          count: depositAndFee?.ataDepositLength,
                        })}
                  </div>
                ) : null}
                {depositAndFee?.openOrdersDeposits?.length ? (
                  <div className="text-right text-th-fgd-2">
                    {depositAndFee?.openOrdersDeposits.length > 1
                      ? t('swap:serum-details_plural', {
                          cost: (
                            sum(depositAndFee?.openOrdersDeposits) /
                            Math.pow(10, 9)
                          ).toFixed(5),
                          count: depositAndFee?.openOrdersDeposits.length,
                        })
                      : t('swap:serum-details', {
                          cost: (
                            sum(depositAndFee?.openOrdersDeposits) /
                            Math.pow(10, 9)
                          ).toFixed(5),
                          count: depositAndFee?.openOrdersDeposits.length,
                        })}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null} */}
        </div>
        {showRoutesModal ? (
          <RoutesModal
            show={showRoutesModal}
            onClose={() => setShowRoutesModal(false)}
            setSelectedRoute={setSelectedRoute}
            selectedRoute={selectedRoute}
            routes={routes}
            inputTokenSymbol={inputTokenInfo!.name}
            outputTokenInfo={outputTokenInfo}
          />
        ) : null}
      </div>
      <div className="flex items-center justify-center p-6">
        <Button
          onClick={onSwap}
          className="flex w-full items-center justify-center text-base"
          size="large"
        >
          {submitting ? (
            <Loading className="mr-2 h-5 w-5" />
          ) : (
            <div className="flex items-center">
              <ArrowsRightLeftIcon className="mr-2 h-5 w-5" />
              {t('swap')}
            </div>
          )}
        </Button>
      </div>
    </div>
  ) : null
}

export default React.memo(SwapReviewRouteInfo)
