import MaxAmountButton from '@components/shared/MaxAmountButton'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import { floorToDecimal } from 'utils/numbers'

const MaxMarketTradeAmount = ({
  setAmountIn,
  useMargin,
  maxAmount,
}: {
  setAmountIn: (x: string) => void
  useMargin: boolean
  maxAmount: (useMargin: boolean) => { max: Decimal; decimals: number }
}) => {
  const { t } = useTranslation('common')
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const { max, decimals } = maxAmount(useMargin)

  if (mangoAccountLoading) return null

  const setMax = (value: Decimal) => {
    setAmountIn(floorToDecimal(value, decimals).toFixed())
  }

  return (
    <MaxAmountButton
      className="text-xs"
      decimals={decimals}
      label={t('max')}
      onClick={() => setMax(max)}
      value={isNaN(max.toNumber()) ? 0 : max}
    />
  )
}

export default MaxMarketTradeAmount
