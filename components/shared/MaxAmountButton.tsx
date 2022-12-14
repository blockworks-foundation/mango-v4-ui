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
      className={`font-normal no-underline ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      <p className="mr-1 text-th-fgd-4">{label}:</p>
      <span className="font-mono text-th-fgd-2 underline">{value}</span>
    </LinkButton>
  )
}

export default MaxAmountButton
