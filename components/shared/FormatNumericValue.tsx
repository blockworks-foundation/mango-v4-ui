import Decimal from 'decimal.js'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { PRIVACY_MODE } from 'utils/constants'
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
  const [privacyMode] = useLocalStorageState(PRIVACY_MODE)
  return (
    <span className={classNames}>
      {isUsd
        ? privacyMode
          ? '****'
          : formatCurrencyValue(value, decimals)
        : formatNumericValue(value, decimals, roundUp)}
    </span>
  )
}

export default FormatNumericValue
