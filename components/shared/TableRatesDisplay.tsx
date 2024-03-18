import { useTranslation } from 'react-i18next'
import FormatNumericValue from './FormatNumericValue'
import Tooltip from './Tooltip'

const TableRatesDisplay = ({
  borrowRate,
  depositRate,
}: {
  borrowRate: number
  depositRate: number
}) => {
  const { t } = useTranslation('common')
  return (
    <>
      <Tooltip content={t('deposit-rate')}>
        <p
          className={`cursor-help ${
            !depositRate || depositRate < 0.01 ? 'text-th-fgd-4' : 'text-th-up'
          }`}
        >
          <FormatNumericValue value={depositRate || 0} decimals={2} />%
        </p>
      </Tooltip>
      <span className="text-th-fgd-4">|</span>
      <Tooltip content={t('borrow-rate')}>
        <p className="cursor-help text-th-down">
          <FormatNumericValue value={borrowRate || 0} decimals={2} />%
        </p>
      </Tooltip>
    </>
  )
}

export default TableRatesDisplay
