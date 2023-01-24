import Decimal from 'decimal.js'
import FormatNumericValue from './FormatNumericValue'

const AmountWithValue = ({
  amount,
  amountDecimals,
  value,
  stacked,
}: {
  amount: Decimal | number | string
  amountDecimals?: number
  value: number | string
  stacked?: boolean
}) => {
  return (
    <p className={`font-mono text-th-fgd-2 ${stacked ? 'text-right' : ''}`}>
      <>
        <FormatNumericValue value={amount} decimals={amountDecimals} />{' '}
        <span className={`text-th-fgd-4 ${stacked ? 'block' : ''}`}>
          <FormatNumericValue value={value} decimals={2} isUsd={true} />
        </span>
      </>
    </p>
  )
}

export default AmountWithValue
