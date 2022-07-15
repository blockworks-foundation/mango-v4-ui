import {
  ArrowSmRightIcon,
  ChevronRightIcon,
  CogIcon,
  InformationCircleIcon,
  RefreshIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid'
import { RouteInfo, TransactionFeeInfo } from '@jup-ag/core'
import { useEffect, useState } from 'react'
import mangoStore from '../../store/state'
import { TokenInfo } from '../../types/jupiter'
import { formatDecimal } from '../../utils/numbers'

type RouteFeeInfoProps = {
  selectedRoute: RouteInfo
  amountIn: number
  amountOut: number
  outputTokenInfo: TokenInfo
  inputTokenSymbol: string
  showRoutesModal: () => void
}

const RouteFeeInfo = ({
  selectedRoute,
  amountIn,
  amountOut,
  outputTokenInfo,
  inputTokenSymbol,
  showRoutesModal,
}: RouteFeeInfoProps) => {
  const tokens = mangoStore.getState().jupiterTokens
  const connected = mangoStore((s) => s.connected)

  const [depositAndFee, setDepositAndFee] = useState<TransactionFeeInfo>()
  const [swapRate, setSwapRate] = useState<boolean>(false)
  const [feeValue, setFeeValue] = useState<number | null>(null)

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

  return (
    <div className="mt-6 space-y-2 px-1 text-xs text-th-fgd-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-bold text-th-fgd-1">Swap Details</div>
      </div>
      <div className="flex items-center justify-between">
        <span>Swap Route</span>
        <div
          className="flex items-center rounded border border-th-bkg-4 p-1 pl-2 hover:cursor-pointer hover:border-th-fgd-4"
          role="button"
          onClick={showRoutesModal}
        >
          <span className="overflow-ellipsis whitespace-nowrap text-th-fgd-1">
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
          <ChevronRightIcon className="ml-2 h-3 w-3" />
        </div>
      </div>
      {amountOut && amountIn ? (
        <div className="flex justify-between">
          <span>Rate</span>
          <div>
            <div className="flex items-center justify-end">
              <div className="text-right text-th-fgd-1">
                {swapRate ? (
                  <>
                    1 {inputTokenSymbol} ≈{' '}
                    {formatDecimal(amountOut / amountIn, 6)}{' '}
                    {outputTokenInfo?.symbol}
                  </>
                ) : (
                  <>
                    1 {outputTokenInfo?.symbol} ≈{' '}
                    {formatDecimal(amountIn / amountOut, 6)} {inputTokenSymbol}
                  </>
                )}
              </div>
              <SwitchHorizontalIcon
                className="default-transition ml-1 h-4 w-4 cursor-pointer text-th-fgd-3 hover:text-th-fgd-2"
                onClick={() => setSwapRate(!swapRate)}
              />
            </div>
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
          </div>
        </div>
      ) : null}
      <div className="flex justify-between">
        <span>Price Impact</span>
        <div className="text-right text-th-fgd-1">
          {selectedRoute?.priceImpactPct * 100 < 0.1
            ? '< 0.1%'
            : `~ ${(selectedRoute?.priceImpactPct * 100).toFixed(4)}%`}
        </div>
      </div>
      <div className="flex justify-between">
        <span>Minimum Received</span>
        {outputTokenInfo?.decimals ? (
          <div className="text-right text-th-fgd-1">
            {formatDecimal(
              selectedRoute?.outAmountWithSlippage /
                10 ** outputTokenInfo.decimals || 1,
              6
            )}{' '}
            {outputTokenInfo?.symbol}
          </div>
        ) : null}
      </div>
      {typeof feeValue === 'number' ? (
        <div className="flex justify-between">
          <span>Swap fee</span>
          <div className="flex items-center">
            <div className="text-right text-th-fgd-1">
              ≈ ${feeValue?.toFixed(2)}
            </div>
          </div>
        </div>
      ) : (
        selectedRoute?.marketInfos.map((info, index) => {
          const feeToken = tokens.find(
            (item) => item?.address === info.lpFee?.mint
          )
          return (
            <div className="flex justify-between" key={index}>
              <span>Fees paid to {info?.amm?.label}</span>
              {feeToken?.decimals && (
                <div className="text-right text-th-fgd-1">
                  {(
                    info.lpFee?.amount / Math.pow(10, feeToken.decimals)
                  ).toFixed(6)}{' '}
                  {feeToken?.symbol} ({info.lpFee?.pct * 100}%)
                </div>
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
  )
}

export default RouteFeeInfo
