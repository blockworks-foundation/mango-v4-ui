import MaxAmountButton from '@components/shared/MaxAmountButton'
import { useTokenMax } from '@components/swap/useTokenMax'
import mangoStore from '@store/mangoStore'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo } from 'react'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'

const MaxMarketSwapAmount = ({
  setAmountIn,
  useMargin,
}: {
  setAmountIn: (x: string) => void
  useMargin: boolean
}) => {
  const { t } = useTranslation('common')
  const { price: oraclePrice, serumOrPerpMarket } = useSelectedMarket()
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const { amount: tokenMax, amountWithBorrow, decimals } = useTokenMax()

  const tickDecimals = useMemo(() => {
    if (!serumOrPerpMarket) return decimals
    return getDecimalCount(serumOrPerpMarket.tickSize)
  }, [decimals, serumOrPerpMarket])

  const maxAmount = useMemo(() => {
    const balanceMax = useMargin ? amountWithBorrow : tokenMax
    const { side } = mangoStore.getState().tradeForm
    const sideMax =
      side === 'buy' ? balanceMax.toNumber() / oraclePrice : balanceMax
    return floorToDecimal(sideMax, tickDecimals).toFixed()
  }, [amountWithBorrow, oraclePrice, tickDecimals, tokenMax, useMargin])

  const setMax = useCallback(() => {
    const { side } = mangoStore.getState().tradeForm
    const max = useMargin ? amountWithBorrow : tokenMax
    const maxDecimals = side === 'buy' ? tickDecimals : decimals
    setAmountIn(floorToDecimal(max, maxDecimals).toFixed())
  }, [decimals, setAmountIn, tickDecimals, useMargin])

  if (mangoAccountLoading) return null

  return (
    <div className="mb-2 mt-3 flex w-full items-center justify-between">
      <p className="text-xs text-th-fgd-3">{t('trade:size')}</p>
      <MaxAmountButton
        className="text-xs"
        decimals={decimals}
        label={t('max')}
        onClick={() => setMax()}
        value={maxAmount}
      />
    </div>
  )
}

export default MaxMarketSwapAmount
