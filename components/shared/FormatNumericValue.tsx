import Decimal from 'decimal.js'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { PRIVACY_MODE, PRIVATE_MODE_STRING } from 'utils/constants'
import { formatCurrencyValue, formatNumericValue } from 'utils/numbers'

const FormatNumericValue = ({
  classNames,
  value,
  decimals,
  isUsd,
  isPrivate,
  roundUp,
}: {
  classNames?: string
  value: Decimal | number | string
  decimals?: number
  isUsd?: boolean
  isPrivate?: boolean
  roundUp?: boolean
}) => {
  const [privacyMode] = useLocalStorageState(PRIVACY_MODE)
  return (
    <span className={classNames}>
      {privacyMode && isPrivate
        ? PRIVATE_MODE_STRING
        : isUsd
        ? formatCurrencyValue(value, decimals)
        : formatNumericValue(value, decimals, roundUp)}
    </span>
  )
}

export default FormatNumericValue
