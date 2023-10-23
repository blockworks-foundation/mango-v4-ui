import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import * as sentry from '@sentry/nextjs'

import mangoStore from '@store/mangoStore'
import Button, { IconButton } from '../shared/Button'
import Loading from '../shared/Loading'
import {
  ArrowLeftIcon,
  PencilIcon,
  ArrowsRightLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { formatNumericValue } from '../../utils/numbers'
import { notify } from '../../utils/notifications'
import useJupiterMints from '../../hooks/useJupiterMints'
import { JupiterV6RouteInfo } from 'types/jupiter'
import useJupiterSwapData from './useJupiterSwapData'
// import { Transaction } from '@solana/web3.js'
import {
  JUPITER_V6_QUOTE_API_MAINNET,
  SOUND_SETTINGS_KEY,
} from 'utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { Howl } from 'howler'
import { INITIAL_SOUND_SETTINGS } from '@components/settings/SoundSettings'
import Tooltip from '@components/shared/Tooltip'
import { Disclosure, Transition } from '@headlessui/react'
import RoutesModal from './RoutesModal'
// import { createAssociatedTokenAccountIdempotentInstruction } from '@blockworks-foundation/mango-v4'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { isMangoError } from 'types'
import { useWallet } from '@solana/wallet-adapter-react'
import TokenLogo from '@components/shared/TokenLogo'

type JupiterRouteInfoProps = {
  amountIn: Decimal
  isWalletSwap?: boolean
  onClose: () => void
  onSuccess?: () => void
  routes: JupiterV6RouteInfo[] | undefined
  selectedRoute: JupiterV6RouteInfo | undefined | null
  setSelectedRoute: Dispatch<
    SetStateAction<JupiterV6RouteInfo | undefined | null>
  >
  slippage: number
  show: boolean
}

const deserializeJupiterIxAndAlt = async (
  connection: Connection,
  swapTransaction: string,
): Promise<[TransactionInstruction[], AddressLookupTableAccount[]]> => {
  const parsedSwapTransaction = VersionedTransaction.deserialize(
    Buffer.from(swapTransaction, 'base64'),
  )
  const message = parsedSwapTransaction.message
  // const lookups = message.addressTableLookups
  const addressLookupTablesResponses = await Promise.all(
    message.addressTableLookups.map((alt) =>
      connection.getAddressLookupTable(alt.accountKey),
    ),
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

// const prepareMangoRouterInstructions = async (
//   selectedRoute: RouteInfo,
//   inputMint: PublicKey,
//   outputMint: PublicKey,
//   userPublicKey: PublicKey,
// ): Promise<[TransactionInstruction[], AddressLookupTableAccount[]]> => {
//   if (!selectedRoute || !selectedRoute.mints || !selectedRoute.instructions) {
//     return [[], []]
//   }
//   const mintsToFilterOut = [inputMint, outputMint]
//   const filteredOutMints = [
//     ...selectedRoute.mints.filter(
//       (routeMint) =>
//         !mintsToFilterOut.find((filterOutMint) =>
//           filterOutMint.equals(routeMint),
//         ),
//     ),
//   ]
//   const additionalInstructions = []
//   for (const mint of filteredOutMints) {
//     const ix = await createAssociatedTokenAccountIdempotentInstruction(
//       userPublicKey,
//       userPublicKey,
//       mint,
//     )
//     additionalInstructions.push(ix)
//   }
//   const instructions = [
//     ...additionalInstructions,
//     ...selectedRoute.instructions,
//   ]
//   return [instructions, []]
// }

export const fetchJupiterTransaction = async (
  connection: Connection,
  selectedRoute: JupiterV6RouteInfo,
  userPublicKey: PublicKey,
  slippage: number,
  inputMint: PublicKey,
  outputMint: PublicKey,
  isDirectWalletSwap = false,
): Promise<[TransactionInstruction[], AddressLookupTableAccount[]]> => {
  const transactions = await (
    await fetch(`${JUPITER_V6_QUOTE_API_MAINNET}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // response from /quote api
        quoteResponse: selectedRoute,
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
    swapTransaction,
  )

  const isSetupIx = (pk: PublicKey): boolean =>
    pk.toString() === 'ComputeBudget111111111111111111111111111111' ||
    pk.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

  const isDuplicateAta = (ix: TransactionInstruction): boolean => {
    return (
      ix.programId.toString() ===
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' &&
      (ix.keys[3].pubkey.toString() === inputMint.toString() ||
        ix.keys[3].pubkey.toString() === outputMint.toString())
    )
  }

  //if its in wallet swap we need ATA creation
  const filtered_jup_ixs = ixs
    .filter((ix) => (!isDirectWalletSwap ? !isSetupIx(ix.programId) : true))
    .filter((ix) => (!isDirectWalletSwap ? !isDuplicateAta(ix) : true))

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
  isWalletSwap,
  onClose,
  onSuccess,
  routes,
  selectedRoute,
  setSelectedRoute,
  show,
}: JupiterRouteInfoProps) => {
  const { t } = useTranslation(['common', 'trade'])
  const slippage = mangoStore((s) => s.swap.slippage)
  const wallet = useWallet()
  const [showRoutesModal, setShowRoutesModal] = useState<boolean>(false)
  const [swapRate, setSwapRate] = useState<boolean>(false)
  const [feeValue] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [coingeckoPrices, setCoingeckoPrices] = useState(EMPTY_COINGECKO_PRICES)
  const { jupiterTokens } = useJupiterMints()
  const { inputTokenInfo, outputTokenInfo } = useJupiterSwapData()
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)
  const [soundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS,
  )
  const focusRef = useRef<HTMLButtonElement>(null)

  const amountOut = useMemo(() => {
    if (!selectedRoute?.outAmount || !outputTokenInfo) return
    return new Decimal(selectedRoute.outAmount.toString()).div(
      10 ** outputTokenInfo.decimals,
    )
  }, [selectedRoute, outputTokenInfo])

  useEffect(() => {
    if (focusRef?.current) {
      focusRef.current.focus()
    }
  }, [focusRef])

  useEffect(() => {
    setCoingeckoPrices(EMPTY_COINGECKO_PRICES)
    const fetchTokenPrices = async () => {
      const inputId = inputTokenInfo?.extensions?.coingeckoId
      const outputId = outputTokenInfo?.extensions?.coingeckoId

      if (inputId && outputId) {
        try {
          const results = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${inputId},${outputId}&vs_currencies=usd`,
          )
          const json = await results.json()
          if (json[inputId]?.usd && json[outputId]?.usd) {
            setCoingeckoPrices({
              inputCoingeckoPrice: json[inputId].usd,
              outputCoingeckoPrice: json[outputId].usd,
            })
          }
        } catch (e) {
          console.error('Loading coingecko prices: ', e)
        }
      }
    }

    if (inputTokenInfo && outputTokenInfo) {
      fetchTokenPrices()
    }
  }, [inputTokenInfo, outputTokenInfo])

  const onWalletSwap = useCallback(async () => {
    if (!selectedRoute || !inputBank || !outputBank || !wallet.publicKey) return
    const actions = mangoStore.getState().actions
    const client = mangoStore.getState().client
    const connection = mangoStore.getState().connection
    setSubmitting(true)
    try {
      const [ixs] = await fetchJupiterTransaction(
        connection,
        selectedRoute,
        wallet.publicKey,
        slippage,
        inputBank.mint,
        outputBank.mint,
        true,
      )

      const tx = await client.sendAndConfirmTransaction(ixs)
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx.signature,
      })
      actions.fetchWalletTokens(wallet.publicKey)
    } catch (e) {
      console.log('error swapping wallet tokens', e)
    } finally {
      setSubmitting(false)
      onClose()
    }
  }, [
    inputBank,
    outputBank,
    onClose,
    selectedRoute,
    slippage,
    wallet.publicKey,
  ])

  const onSwap = useCallback(async () => {
    if (!selectedRoute) return
    try {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const inputBank = mangoStore.getState().swap.inputBank
      const outputBank = mangoStore.getState().swap.outputBank
      const set = mangoStore.getState().set
      const connection = mangoStore.getState().connection

      if (
        !mangoAccount ||
        !group ||
        !inputBank ||
        !outputBank ||
        !wallet.publicKey
      )
        return
      setSubmitting(true)
      const [ixs, alts] =
        // selectedRoute.routerName === 'Mango'
        //   ? await prepareMangoRouterInstructions(
        //       selectedRoute,
        //       inputBank.mint,
        //       outputBank.mint,
        //       mangoAccount.owner,
        //     )
        // :
        await fetchJupiterTransaction(
          connection,
          selectedRoute,
          wallet.publicKey,
          slippage,
          inputBank.mint,
          outputBank.mint,
        )

      try {
        const { signature: tx, slot } = await client.marginTrade({
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
          s.successAnimation.swap = true
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
        actions.fetchSwapHistory(mangoAccount.publicKey.toString(), 30000)
        await actions.reloadMangoAccount(slot)
        if (onSuccess) {
          onSuccess()
        }
      } catch (e) {
        console.error('onSwap error: ', e)
        sentry.captureException(e)
        if (isMangoError(e)) {
          notify({
            title: 'Transaction failed',
            description: e.message,
            txid: e?.txid,
            type: 'error',
          })
        }
      } finally {
        setSubmitting(false)
      }
    } catch (e) {
      console.error('Swap error:', e)
    } finally {
      onClose()
    }
  }, [
    amountIn,
    inputBank,
    outputBank,
    onClose,
    onSuccess,
    selectedRoute,
    slippage,
    soundSettings,
    wallet.publicKey,
  ])

  const onClick = isWalletSwap ? onWalletSwap : onSwap

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
              coingeckoPrices?.inputCoingeckoPrice,
            ),
          )
          .div(amountIn.div(amountOut))
          .mul(100)
      : new Decimal(0)
  }, [coingeckoPrices, amountIn, amountOut])

  return routes?.length &&
    selectedRoute &&
    inputTokenInfo &&
    outputTokenInfo &&
    amountOut ? (
    <Transition
      className="absolute right-0 top-0 z-10 h-full w-full bg-th-bkg-1 pb-0"
      show={show}
      enter="transition ease-in duration-300"
      enterFrom="-translate-x-full"
      enterTo="translate-x-0"
      leave="transition ease-out duration-300"
      leaveFrom="translate-x-0"
      leaveTo="-translate-x-full"
    >
      <div className="thin-scroll flex h-full flex-col justify-between overflow-y-auto">
        <div>
          <IconButton
            className="absolute left-4 top-4 mr-3 text-th-fgd-2"
            onClick={onClose}
            size="small"
            ref={focusRef}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </IconButton>
          <div className="flex justify-center bg-th-bkg-1 p-6 pb-0">
            <div className="mb-3 flex w-full flex-col items-center border-b border-th-bkg-3 pb-4">
              <div className="relative mb-2 w-[72px]">
                <TokenLogo bank={inputBank} size={40} />
                <div className="absolute right-0 top-0">
                  <TokenLogo bank={outputBank} size={40} />
                </div>
              </div>
              <p className="mb-0.5 flex items-center text-center text-lg">
                <span className="mr-1 font-mono text-th-fgd-1">
                  <FormatNumericValue value={amountIn} />
                </span>{' '}
                {inputTokenInfo?.symbol}
                <ArrowRightIcon className="mx-2 h-5 w-5 text-th-fgd-2" />
                <span className="mr-1 font-mono text-th-fgd-1">
                  <FormatNumericValue value={amountOut} />
                </span>{' '}
                {`${outputTokenInfo?.symbol}`}
              </p>
            </div>
          </div>
          <div className="space-y-2 overflow-auto px-6">
            <div className="flex justify-between">
              <p className="text-sm text-th-fgd-3">{t('price')}</p>
              <div>
                <div className="flex items-center justify-end">
                  <p className="text-right font-mono text-sm text-th-fgd-2">
                    {swapRate ? (
                      <>
                        1{' '}
                        <span className="font-body text-th-fgd-3">
                          {inputTokenInfo?.symbol} ≈{' '}
                        </span>
                        <FormatNumericValue value={amountOut.div(amountIn)} />{' '}
                        <span className="font-body text-th-fgd-3">
                          {outputTokenInfo?.symbol}
                        </span>
                      </>
                    ) : (
                      <>
                        1{' '}
                        <span className="font-body text-th-fgd-3">
                          {outputTokenInfo?.symbol} ≈{' '}
                        </span>
                        <FormatNumericValue value={amountIn.div(amountOut)} />{' '}
                        <span className="font-body text-th-fgd-3">
                          {inputTokenInfo?.symbol}
                        </span>
                      </>
                    )}
                  </p>
                  <ArrowsRightLeftIcon
                    className="ml-1 h-4 w-4 cursor-pointer text-th-fgd-2 hover:text-th-active"
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
                      <span className="font-body text-th-fgd-3">{`${
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
              {outputTokenInfo?.decimals && selectedRoute ? (
                <p className="text-right font-mono text-sm text-th-fgd-2">
                  {selectedRoute.swapMode === 'ExactIn' ? (
                    <FormatNumericValue
                      value={
                        selectedRoute.otherAmountThreshold /
                        10 ** outputTokenInfo.decimals
                      }
                      decimals={outputTokenInfo.decimals}
                    />
                  ) : (
                    <FormatNumericValue
                      value={
                        selectedRoute.outAmount / 10 ** outputTokenInfo.decimals
                      }
                      decimals={outputTokenInfo.decimals}
                    />
                  )}{' '}
                  <span className="font-body text-th-fgd-3">
                    {outputTokenInfo?.symbol}
                  </span>
                </p>
              ) : null}
            </div>
            {selectedRoute?.swapMode === 'ExactOut' ? (
              <div className="flex justify-between">
                <p className="text-sm text-th-fgd-3">
                  {t('swap:maximum-cost')}
                </p>
                {inputTokenInfo?.decimals && selectedRoute ? (
                  <p className="text-right font-mono text-sm text-th-fgd-2">
                    <FormatNumericValue
                      value={
                        selectedRoute.otherAmountThreshold /
                        10 ** inputTokenInfo.decimals
                      }
                      decimals={inputTokenInfo.decimals}
                    />{' '}
                    <span className="font-body text-th-fgd-3">
                      {inputTokenInfo?.symbol}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="flex justify-between">
              <Tooltip
                content={
                  <>
                    <p>
                      The price impact is the difference observed between the
                      total value of the entry tokens swapped and the
                      destination tokens obtained.
                    </p>
                    <p className="mt-1">
                      The bigger the trade is, the bigger the price impact can
                      be.
                    </p>
                  </>
                }
              >
                <p className="tooltip-underline">{t('swap:price-impact')}</p>
              </Tooltip>
              <p className="text-right font-mono text-sm text-th-fgd-2">
                {selectedRoute?.priceImpactPct * 100 < 0.1
                  ? '<0.1%'
                  : `${(selectedRoute?.priceImpactPct * 100).toFixed(2)}%`}
              </p>
            </div>
            {borrowAmount ? (
              <>
                <div className="flex justify-between">
                  <Tooltip
                    content={
                      balance
                        ? t('swap:tooltip-borrow-balance', {
                            balance: formatNumericValue(balance),
                            borrowAmount: formatNumericValue(borrowAmount),
                            token: inputTokenInfo?.symbol,
                            rate: formatNumericValue(
                              inputBank!.getBorrowRateUi(),
                              2,
                            ),
                          })
                        : t('swap:tooltip-borrow-no-balance', {
                            borrowAmount: formatNumericValue(borrowAmount),
                            token: inputTokenInfo?.symbol,
                            rate: formatNumericValue(
                              inputBank!.getBorrowRateUi(),
                              2,
                            ),
                          })
                    }
                    delay={100}
                  >
                    <p className="tooltip-underline">{t('borrow-amount')}</p>
                  </Tooltip>
                  <p className="text-right font-mono text-sm text-th-fgd-2">
                    <FormatNumericValue value={borrowAmount} />{' '}
                    <span className="font-body text-th-fgd-3">
                      {inputTokenInfo?.symbol}
                    </span>
                  </p>
                </div>
                <div className="flex justify-between">
                  <Tooltip
                    content={t('loan-origination-fee-tooltip', {
                      fee: `${(
                        inputBank!.loanOriginationFeeRate.toNumber() * 100
                      ).toFixed(3)}%`,
                    })}
                    delay={100}
                  >
                    <p className="tooltip-underline">
                      {t('loan-origination-fee')}
                    </p>
                  </Tooltip>
                  <p className="text-right font-mono text-th-fgd-2">
                    <FormatNumericValue
                      value={
                        borrowAmount *
                        inputBank!.loanOriginationFeeRate.toNumber()
                      }
                      decimals={inputBank!.mintDecimals}
                    />{' '}
                    <span className="font-body text-th-fgd-3">
                      {inputBank!.name}
                    </span>
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </div>
        <div className="p-6">
          <div className="mb-4 flex items-center justify-center">
            <Button
              onClick={onClick}
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
          <div className="rounded-md bg-th-bkg-2">
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button
                    className={`flex w-full items-center justify-between rounded-md p-3 focus-visible:bg-th-bkg-3 ${
                      open ? 'mb-2 rounded-b-none' : ''
                    }`}
                  >
                    <p>{t('swap:route-info')}</p>
                    <ChevronDownIcon
                      className={`${
                        open ? 'rotate-180' : 'rotate-360'
                      } h-5 w-5 text-th-fgd-3`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="space-y-2 p-3 pt-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-th-fgd-3">
                        {t('swap:swap-route')}
                      </p>
                      <div
                        className="flex items-center text-th-fgd-2 md:hover:cursor-pointer md:hover:text-th-fgd-3"
                        role="button"
                        onClick={() => setShowRoutesModal(true)}
                      >
                        <span className="overflow-ellipsis whitespace-nowrap">
                          {selectedRoute?.routePlan.map((info, index) => {
                            let includeSeparator = false
                            if (
                              selectedRoute?.routePlan.length > 1 &&
                              index !== selectedRoute?.routePlan.length - 1
                            ) {
                              includeSeparator = true
                            }
                            return (
                              <span key={index}>{`${info?.swapInfo.label} ${
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
                      selectedRoute?.routePlan.map((info, index) => {
                        const feeToken = jupiterTokens.find(
                          (item) => item?.address === info.swapInfo.feeMint,
                        )
                        return (
                          <div className="flex justify-between" key={index}>
                            <p className="text-sm text-th-fgd-3">
                              {t('swap:fees-paid-to', {
                                route: info?.swapInfo.label,
                              })}
                            </p>
                            {feeToken?.decimals && (
                              <p className="pl-4 text-right font-mono text-sm text-th-fgd-2">
                                {(
                                  info.swapInfo.feeAmount /
                                  Math.pow(10, feeToken.decimals)
                                ).toFixed(6)}{' '}
                                <span className="font-body">
                                  {feeToken?.symbol}
                                </span>{' '}
                                (
                                {(
                                  (info.swapInfo.outputMint == feeToken.address
                                    ? info.swapInfo.feeAmount /
                                      info.swapInfo.outAmount
                                    : info.swapInfo.feeAmount /
                                      info.swapInfo.inAmount) * 100
                                ).toLocaleString(undefined, {
                                  maximumSignificantDigits: 2,
                                })}
                                %)
                              </p>
                            )}
                          </div>
                        )
                      })
                    )}
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          </div>
        </div>
        {showRoutesModal ? (
          <RoutesModal
            show={showRoutesModal}
            onClose={() => setShowRoutesModal(false)}
            setSelectedRoute={setSelectedRoute}
            selectedRoute={selectedRoute}
            routes={routes}
            inputTokenSymbol={inputTokenInfo?.name}
            outputTokenInfo={outputTokenInfo}
          />
        ) : null}
      </div>
    </Transition>
  ) : null
}

export default React.memo(SwapReviewRouteInfo)
