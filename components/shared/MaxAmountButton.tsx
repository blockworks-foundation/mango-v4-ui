import { LinkButton } from './Button'

const MaxAmountButton = ({
  className,
  disabled,
  label,
  onClick,
  value,
}: {
  className?: string
  disabled?: boolean
  label: string
  onClick: () => void
  value: string
}) => {
  return (
    <LinkButton
      className={`no-underline ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="mr-1 font-normal text-th-fgd-4">{label}:</span>
      <span className="font-mono text-th-fgd-2 underline">{value}</span>
    </LinkButton>
  )
}

export default MaxAmountButton
