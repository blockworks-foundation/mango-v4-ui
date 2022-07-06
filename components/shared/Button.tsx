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
      className={`whitespace-nowrap rounded-2xl bg-th-bkg-button px-6 py-2 font-bold drop-shadow-md 
      focus:outline-none disabled:cursor-not-allowed disabled:hover:brightness-100 md:hover:brightness-[1.1] ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export const IconButton: FunctionComponent<ButtonProps> = ({
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
      className={`${className} flex h-7 w-7 items-center justify-center rounded-full bg-th-bkg-4 text-th-fgd-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-th-bkg-4 
      disabled:text-th-fgd-4 md:hover:text-th-primary md:disabled:hover:text-th-fgd-4`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
