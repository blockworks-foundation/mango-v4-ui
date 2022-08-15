import { useTheme } from 'next-themes'
import { FunctionComponent, ReactNode } from 'react'

interface AllButtonProps {
  onClick?: (e?: React.MouseEvent) => void
  disabled?: boolean
  className?: string
  secondary?: boolean
  children?: ReactNode
}

interface ButtonProps {
  size?: 'large' | 'medium' | 'small'
}

type ButtonCombinedProps = AllButtonProps & ButtonProps

const Button: FunctionComponent<ButtonCombinedProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  secondary,
  size = 'medium',
  ...props
}) => {
  const { theme } = useTheme()
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`whitespace-nowrap rounded-md ${
        secondary
          ? `border border-th-button md:hover:border-th-button-hover ${
              theme === 'Light' ? 'text-th-button' : 'text-th-fgd-1'
            }`
          : `bg-th-button md:hover:bg-th-button-hover ${
              theme === 'Light' ? 'text-th-bkg-1' : 'text-th-fgd-1'
            }`
      } ${
        size === 'medium'
          ? 'h-10 px-4'
          : size === 'large'
          ? 'h-12 px-6'
          : 'h-8 px-3'
      } default-transition font-bold focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface IconButtonProps {
  hideBg?: boolean
  size?: 'small' | 'medium' | 'large'
}

type IconButtonCombinedProps = AllButtonProps & IconButtonProps

export const IconButton: FunctionComponent<IconButtonCombinedProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  hideBg,
  size = 'medium',
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex ${
        size === 'large'
          ? 'h-12 w-12'
          : size === 'small'
          ? 'h-7 w-7'
          : 'h-10 w-10'
      } items-center justify-center rounded-full ${
        hideBg ? '' : 'bg-th-bkg-4'
      } text-th-fgd-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-th-bkg-4 
      disabled:text-th-fgd-4 md:hover:text-th-primary md:disabled:hover:text-th-fgd-4 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface LinkButtonProps {
  icon?: ReactNode
}

type LinkButtonCombinedProps = AllButtonProps & LinkButtonProps

export const LinkButton: FunctionComponent<LinkButtonCombinedProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  secondary,
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center border-0 font-bold ${
        secondary ? 'text-th-primary' : 'text-th-fgd-2'
      } underline focus:outline-none disabled:cursor-not-allowed disabled:underline disabled:opacity-50 md:hover:no-underline  ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
