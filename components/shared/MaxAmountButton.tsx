import Decimal from 'decimal.js'
import { LinkButton } from './Button'
import FormatNumericValue from './FormatNumericValue'

const MaxAmountButton = ({
  className,
  decimals,
  disabled,
  label,
  onClick,
  value,
}: {
  className?: string
  decimals?: number
  disabled?: boolean
  label: string
  onClick: () => void
  value: number | string | Decimal
}) => {
  return (
    <LinkButton
      className={`font-normal ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      <p className="mr-1 text-th-fgd-4">{label}:</p>
      <span className="font-mono">
        <FormatNumericValue value={value} decimals={decimals} />
      </span>
    </LinkButton>
  )
}

export default MaxAmountButton
