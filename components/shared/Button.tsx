import { FunctionComponent, ReactNode } from 'react'

interface ButtonProps {
  onClick?: (e?: React.MouseEvent) => void
  disabled?: boolean
  className?: string
  primary?: boolean
  children?: ReactNode
}

const Button: FunctionComponent<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`whitespace-nowrap rounded-full bg-mango-500 px-6 py-2 font-bold text-mango-200 hover:brightness-[1.1] focus:outline-none 
      disabled:cursor-not-allowed disabled:hover:brightness-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
