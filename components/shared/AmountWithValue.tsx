import Decimal from 'decimal.js'

const AmountWithValue = ({
  amount,
  value,
  stacked,
}: {
  amount: Decimal | number | string
  value: string
  stacked?: boolean
}) => {
  return (
    <p className={`font-mono text-th-fgd-2 ${stacked ? 'text-right' : ''}`}>
      <>
        {amount}{' '}
        <span className={`text-th-fgd-4 ${stacked ? 'block' : ''}`}>
          {value}
        </span>
      </>
    </p>
  )
}

export default AmountWithValue
