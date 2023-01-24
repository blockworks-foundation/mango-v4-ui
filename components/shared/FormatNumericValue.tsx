import Decimal from 'decimal.js'
import { formatNumericValue } from 'utils/numbers'

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
  return <span>{formatNumericValue(value, decimals, isUsd, roundUp)}</span>
}

export default FormatNumericValue
