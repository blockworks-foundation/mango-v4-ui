import Decimal from 'decimal.js'
import { formatCurrencyValue, formatNumericValue } from 'utils/numbers'

const FormatNumericValue = ({
  classNames,
  value,
  decimals,
  isUsd,
  roundUp,
}: {
  classNames?: string
  value: Decimal | number | string
  decimals?: number
  isUsd?: boolean
  roundUp?: boolean
}) => {
  return (
    <span className={classNames}>
      {isUsd
        ? formatCurrencyValue(value, decimals)
        : formatNumericValue(value, decimals, roundUp)}
    </span>
  )
}

export default FormatNumericValue
