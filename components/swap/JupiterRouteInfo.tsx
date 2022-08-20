import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { TransactionInstruction, PublicKey } from '@solana/web3.js'
import { toNativeDecimals, toUiDecimals } from '@blockworks-foundation/mango-v4'
import { Jupiter, RouteInfo, TransactionFeeInfo } from '@jup-ag/core'
import JSBI from 'jsbi'
import Decimal from 'decimal.js'

import mangoStore from '../../store/state'
import RoutesModal from './RoutesModal'
import Button, { IconButton } from '../shared/Button'
import Loading from '../shared/Loading'
import {
  ArrowLeftIcon,
  PencilIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid'
import { useTranslation } from 'next-i18next'
import { Token } from '../../types/jupiter'
import Image from 'next/image'
import { formatDecimal } from '../../utils/numbers'
import { notify } from '../../utils/notifications'

type JupiterRouteInfoProps = {
  amountIn: Decimal
  inputTokenInfo: Token | undefined
  jupiter: Jupiter | undefined
  onClose: () => void
  outputTokenInfo: Token | undefined
  routes: RouteInfo[] | undefined
  selectedRoute: RouteInfo | undefined
  setSelectedRoute: Dispatch<SetStateAction<RouteInfo | undefined>>
  slippage: number
}

const parseJupiterRoute = async (
  jupiter: Jupiter,
  selectedRoute: RouteInfo,
  userPublicKey: PublicKey
): Promise<TransactionInstruction[]> => {
  const { transactions } = await jupiter.exchange({
    routeInfo: selectedRoute,
    userPublicKey,
  })
  const { swapTransaction } = transactions
  const instructions = []
  for (const ix of swapTransaction.instructions) {
    if (
      ix.programId.toBase58() === 'JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph'
    ) {
      instructions.push(ix)
    }
  }

  return instructions
}

const JupiterRouteInfo = ({
  inputTokenInfo,
  amountIn,
  onClose,
  jupiter,
  routes,
  outputTokenInfo,
  selectedRoute,
  setSelectedRoute,
}: JupiterRouteInfoProps) => {
  const { t } = useTranslation('trade')
  const [showRoutesModal, setShowRoutesModal] = useState(false)
  const [swapRate, setSwapRate] = useState<boolean>(false)
  const [depositAndFee, setDepositAndFee] = useState<TransactionFeeInfo>()
  const [feeValue, setFeeValue] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)
  const connected = mangoStore((s) => s.connected)

  const inputTokenIconUri = useMemo(() => {
    return inputTokenInfo ? inputTokenInfo.logoURI : ''
  }, [inputTokenInfo])

  const amountOut = useMemo(() => {
    if (!selectedRoute || !outputTokenInfo) return
    return toUiDecimals(
      JSBI.toNumber(selectedRoute.outAmount),
      outputTokenInfo.decimals
    )
  }, [selectedRoute, outputTokenInfo])

  useEffect(() => {
    const getDepositAndFee = async () => {
      const fees = await selectedRoute?.getDepositAndFee()
      if (fees) {
        setDepositAndFee(fees)
      }
    }
    if (selectedRoute && connected) {
      getDepositAndFee()
    }
  }, [selectedRoute, connected])

  const healthImpact = useMemo(() => {
    const group = mangoStore.getState().group
    if (
      !inputTokenInfo ||
      !mangoAccount ||
      !outputTokenInfo ||
      !amountOut ||
      !group
    )
      return 'Unknown'

    const simulatedHealthRatio = mangoAccount
      .simHealthRatioWithTokenPositionChanges(group, [
        {
          mintPk: new PublicKey(inputTokenInfo.address),
          tokenAmount:
            toNativeDecimals(
              amountIn.toNumber(),
              inputTokenInfo.decimals
            ).toNumber() * -1,
        },
        {
          mintPk: new PublicKey(outputTokenInfo.address),
          tokenAmount: toNativeDecimals(
            amountOut,
            outputTokenInfo.decimals
          ).toNumber(),
        },
      ])
      .toNumber()

    // console.log('simulatedHealthRatio', simulatedHealthRatio)
    return simulatedHealthRatio > 100 ? 100 : simulatedHealthRatio
  }, [mangoAccount, inputTokenInfo, outputTokenInfo, amountIn, amountOut])

  const onSwap = async () => {
    if (!jupiter || !selectedRoute) return
    try {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const inputBank = mangoStore.getState().swap.inputBank
      const outputBank = mangoStore.getState().swap.outputBank

      if (!mangoAccount || !group || !inputBank || !outputBank) return

      const ixs = await parseJupiterRoute(
        jupiter,
        selectedRoute,
        mangoAccount!.owner
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
          flashLoanType: { swap: {} },
        })

        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: tx,
        })
        await actions.reloadAccount()
      } catch (e: any) {
        console.log('Error swapping:', e)
        notify({
          title: 'Transaction failed',
          description: e.message,
          txid: e?.signature,
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

  return routes?.length && selectedRoute && outputTokenInfo && amountOut ? (
    <div className="flex h-full flex-col justify-between">
      <div>
        <IconButton
          className="mr-3 text-th-fgd-3"
          onClick={onClose}
          size="small"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </IconButton>
        <div className="mb-6 -mt-4 flex justify-center">
          <div className="flex flex-col items-center">
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
            <p className="mb-0.5 text-lg font-bold text-th-fgd-1">{`${amountIn} ${
              inputTokenInfo!.name
            } for ${amountOut} ${outputTokenInfo.symbol}`}</p>
            <div className="flex items-center justify-end">
              <p className="text-right text-sm">
                {swapRate ? (
                  <>
                    1 {inputTokenInfo!.name} ≈{' '}
                    {formatDecimal(amountOut / amountIn.toNumber(), 6)}{' '}
                    {outputTokenInfo?.symbol}
                  </>
                ) : (
                  <>
                    1 {outputTokenInfo?.symbol} ≈{' '}
                    {formatDecimal(amountIn.toNumber() / amountOut, 6)}{' '}
                    {inputTokenInfo!.name}
                  </>
                )}
              </p>
              <SwitchHorizontalIcon
                className="default-transition ml-1 h-4 w-4 cursor-pointer text-th-fgd-3 hover:text-th-fgd-2"
                onClick={() => setSwapRate(!swapRate)}
              />
            </div>
          </div>
        </div>
        <div className="space-y-2 px-1">
          {/* {tokenPrices?.outputTokenPrice && tokenPrices?.inputTokenPrice ? (
        <div
          className={`text-right ${
            ((amountIn / amountOut -
              tokenPrices?.outputTokenPrice /
                tokenPrices?.inputTokenPrice) /
              (amountIn / amountOut)) *
              100 <=
            0
              ? 'text-th-green'
              : 'text-th-red'
          }`}
        >
          {Math.abs(
            ((amountIn / amountOut -
              tokenPrices?.outputTokenPrice /
                tokenPrices?.inputTokenPrice) /
              (amountIn / amountOut)) *
              100
          ).toFixed(1)}
          %{' '}
          <span className="text-th-fgd-4">{`${
            ((amountIn / amountOut -
              tokenPrices?.outputTokenPrice /
                tokenPrices?.inputTokenPrice) /
              (amountIn / amountOut)) *
              100 <=
            0
              ? 'Cheaper'
              : 'More expensive'
          } CoinGecko`}</span>
        </div>
      ) : null} */}
          <div className="flex justify-between">
            <p className="text-sm text-th-fgd-3">
              {t('trade:minimum-received')}
            </p>
            {outputTokenInfo?.decimals ? (
              <p className="text-right text-sm text-th-fgd-1">
                {formatDecimal(
                  JSBI.toNumber(selectedRoute?.otherAmountThreshold) /
                    10 ** outputTokenInfo.decimals || 1,
                  6
                )}{' '}
                {outputTokenInfo?.symbol}
              </p>
            ) : null}
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-th-fgd-3">Projected Health</p>
            <p
              className={`text-right text-sm text-th-fgd-1 ${
                healthImpact < 0 ? 'text-th-red' : 'text-th-green'
              }`}
            >
              {healthImpact}%
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-th-fgd-3">{t('trade:est-liq-price')}</p>
            <p className="text-right text-sm text-th-fgd-1">N/A</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-th-fgd-3">{t('trade:slippage')}</p>
            <p className="text-right text-sm text-th-fgd-1">
              {selectedRoute?.priceImpactPct * 100 < 0.1
                ? '< 0.1%'
                : `~ ${(selectedRoute?.priceImpactPct * 100).toFixed(4)}%`}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-th-fgd-3">Swap Route</p>
            <div
              className="flex items-center text-th-fgd-1 md:hover:cursor-pointer md:hover:text-th-fgd-3"
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
                    <span key={index}>{`${info.amm.label} ${
                      includeSeparator ? 'x ' : ''
                    }`}</span>
                  )
                })}
              </span>
              <PencilIcon className="ml-2 h-4 w-4" />
            </div>
          </div>
          {typeof feeValue === 'number' ? (
            <div className="flex justify-between">
              <p className="text-sm text-th-fgd-3">{t('fee')}</p>
              <div className="flex items-center">
                <p className="text-right text-sm text-th-fgd-1">
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
                    {t('trade:fees-paid-to', {
                      route: info?.amm?.label,
                    })}
                  </p>
                  {feeToken?.decimals && (
                    <p className="text-right text-sm text-th-fgd-1">
                      {(
                        JSBI.toNumber(info.lpFee?.amount) /
                        Math.pow(10, feeToken.decimals)
                      ).toFixed(6)}{' '}
                      {feeToken?.symbol} ({info.lpFee?.pct * 100}%)
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
            <div className="text-right text-th-fgd-1">
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
                  <InformationCircleIcon className="ml-1.5 h-3.5 w-3.5 cursor-help text-th-primary" />
                </Tooltip>
              </div>
              <div>
                {depositAndFee?.ataDepositLength ? (
                  <div className="text-right text-th-fgd-1">
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
                  <div className="text-right text-th-fgd-1">
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
      <div className="flex items-center justify-center pb-6">
        <Button
          onClick={onSwap}
          className="flex w-full items-center justify-center text-base"
          size="large"
        >
          {submitting ? (
            <Loading className="mr-2 h-5 w-5" />
          ) : (
            t('trade:confirm-trade')
          )}
        </Button>
      </div>
    </div>
  ) : null
}

export default React.memo(JupiterRouteInfo)
