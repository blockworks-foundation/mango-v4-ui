import MaxAmountButton from '@components/shared/MaxAmountButton'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import { floorToDecimal } from 'utils/numbers'
import { TokenMaxResults } from './useTokenMax'

const MaxSwapAmount = ({
  setAmountIn,
  useMargin,
  maxAmount,
}: {
  setAmountIn: (x: string) => void
  useMargin: boolean
  maxAmount: (useMargin: boolean) => TokenMaxResults
}) => {
  const { t } = useTranslation('common')
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const {
    amount: spotMax,
    amountWithBorrow: leverageMax,
    decimals,
  } = maxAmount(useMargin)

  if (mangoAccountLoading) return null

  const setMax = (value: Decimal) => {
    setAmountIn(floorToDecimal(value, decimals).toFixed())
  }

  return (
    <div className="flex flex-wrap justify-end pl-6 text-xs">
      {spotMax.lt(leverageMax) || (spotMax.eq(leverageMax) && !useMargin) ? (
        <MaxAmountButton
          className="mb-0.5"
          decimals={decimals}
          label={useMargin ? t('bal') : t('max')}
          onClick={() => setMax(spotMax)}
          value={spotMax}
        />
      ) : null}
      {useMargin ? (
        <MaxAmountButton
          className="mb-0.5 ml-2"
          decimals={decimals}
          label={t('max')}
          onClick={() => setMax(leverageMax)}
          value={leverageMax}
        />
      ) : null}
    </div>
  )
}

export default MaxSwapAmount
