import MaxAmountButton from '@components/shared/MaxAmountButton'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { trimDecimals } from 'utils/numbers'
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

  const maxBalanceValue = trimDecimals(
    tokenMax.toNumber(),
    decimals
  ).toLocaleString(undefined, { maximumFractionDigits: decimals })
  const maxBorrowValue = trimDecimals(
    amountWithBorrow.toNumber(),
    decimals
  ).toLocaleString(undefined, { maximumFractionDigits: decimals })

  return (
    <div className="flex flex-wrap justify-end pl-6 text-xs">
      <MaxAmountButton
        className="mb-0.5"
        label="Bal"
        onClick={() => setAmountIn(maxBalanceValue)}
        value={maxBalanceValue}
      />
      {useMargin ? (
        <MaxAmountButton
          className="mb-0.5 ml-2"
          label={t('max')}
          onClick={() => setAmountIn(maxBorrowValue)}
          value={maxBorrowValue}
        />
      ) : null}
    </div>
  )
}

export default MaxSwapAmount
