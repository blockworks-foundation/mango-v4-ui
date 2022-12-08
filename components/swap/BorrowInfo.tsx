import Tooltip from '@components/shared/Tooltip'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'
import { useTokenMax } from './useTokenMax'

const BorrowInfo = ({
  amount,
  useMargin,
}: {
  amount: number
  useMargin: boolean
}) => {
  const { t } = useTranslation('common')
  const { amount: tokenMax } = useTokenMax(useMargin)
  const inputBank = mangoStore((s) => s.swap.inputBank)

  const tokenMaxAsNumber = tokenMax.toNumber()
  const borrowAmount = amount - tokenMaxAsNumber

  return amount > tokenMaxAsNumber && inputBank ? (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Tooltip
          content={
            tokenMaxAsNumber
              ? t('swap:tooltip-borrow-balance', {
                  balance: formatFixedDecimals(tokenMaxAsNumber),
                  borrowAmount: formatFixedDecimals(borrowAmount),
                  token: inputBank.name,
                })
              : t('swap:tooltip-borrow-no-balance', {
                  borrowAmount: formatFixedDecimals(borrowAmount),
                  token: inputBank.name,
                })
          }
          delay={250}
        >
          <p className="tooltip-underline text-sm text-th-fgd-3">
            {t('borrow-amount')}
          </p>
        </Tooltip>
        <p className="text-right font-mono text-sm text-th-fgd-3">
          {formatFixedDecimals(borrowAmount)}
          <span className="font-body"> {inputBank.name}</span>
        </p>
      </div>
      <div className="flex justify-between">
        <Tooltip content={t('tooltip-borrow-rate')} delay={250}>
          <p className="tooltip-underline text-sm text-th-fgd-3">
            {t('borrow-rate')}
          </p>
        </Tooltip>
        <p className="text-right font-mono text-sm text-th-down">
          {formatDecimal(inputBank.getBorrowRateUi(), 2, {
            fixed: true,
          })}
          %
        </p>
      </div>
    </div>
  ) : null
}

export default BorrowInfo
