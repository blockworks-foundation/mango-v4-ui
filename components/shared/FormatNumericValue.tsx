import Decimal from 'decimal.js'
import { formatCurrencyValue, formatNumericValue } from 'utils/numbers'

const FormatNumericValue = ({
  value,
  decimals,
  isUsd,
  roundUp,
}: {
  value: Decimal | number | string
  decimals?: number
  isUsd?: boolean
  roundUp?: boolean
}) => {
  return (
    <span>
      {isUsd
        ? formatCurrencyValue(value, decimals)
        : formatNumericValue(value, decimals, roundUp)}
    </span>
  )
}

export default FormatNumericValue
