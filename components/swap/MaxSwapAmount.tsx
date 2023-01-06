import MaxAmountButton from '@components/shared/MaxAmountButton'
import mangoStore from '@store/mangoStore'
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

  const maxBalanceValue = floorToDecimal(
    tokenMax.toNumber(),
    decimals
  ).toFixed()
  const maxBorrowValue = floorToDecimal(
    amountWithBorrow.toNumber(),
    decimals
  ).toFixed()

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
