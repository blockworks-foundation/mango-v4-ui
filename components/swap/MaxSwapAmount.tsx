import MaxAmountButton from '@components/shared/MaxAmountButton'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import { floorToDecimal } from 'utils/numbers'
import { useTokenMax } from './useTokenMax'

const MaxSwapAmount = ({
  setAmountIn,
  useMargin,
}: {
  setAmountIn: (x: string) => void
  useMargin: boolean
}) => {
  const { t } = useTranslation('common')
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const {
    amount: tokenMax,
    amountWithBorrow,
    decimals,
  } = useTokenMax(useMargin)

  if (mangoAccountLoading) return null

  const setMax = (value: Decimal) => {
    setAmountIn(floorToDecimal(value, decimals).toFixed())
  }

  return (
    <div className="flex flex-wrap justify-end pl-6 text-xs">
      {tokenMax.lt(amountWithBorrow) ||
      (tokenMax.eq(amountWithBorrow) && !useMargin) ? (
        <MaxAmountButton
          className="mb-0.5"
          decimals={decimals}
          label={useMargin ? t('bal') : t('max')}
          onClick={() => setMax(tokenMax)}
          value={tokenMax}
        />
      ) : null}
      {useMargin ? (
        <MaxAmountButton
          className="mb-0.5 ml-2"
          decimals={decimals}
          label={t('max')}
          onClick={() => setMax(amountWithBorrow)}
          value={amountWithBorrow}
        />
      ) : null}
    </div>
  )
}

export default MaxSwapAmount
