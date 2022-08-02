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
  highlightButton?: boolean
}

type ButtonCombinedProps = AllButtonProps & ButtonProps

const Button: FunctionComponent<ButtonCombinedProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  secondary,
  size = 'medium',
  highlightButton,
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`whitespace-nowrap rounded-md ${
        secondary
          ? 'border border-th-bkg-button'
          : highlightButton
          ? 'bg-th-primary text-th-bkg-1'
          : 'bg-th-bkg-button'
      } ${
        size === 'medium'
          ? 'h-10 px-4'
          : size === 'large'
          ? 'h-12 px-6'
          : 'h-8 px-3'
      } font-bold drop-shadow-md 
      focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100 md:hover:brightness-[1.1] ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface IconButtonProps {
  hideBg?: boolean
  large?: boolean
}

type IconButtonCombinedProps = AllButtonProps & IconButtonProps

export const IconButton: FunctionComponent<IconButtonCombinedProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  hideBg,
  large,
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} flex ${
        large ? 'h-12 w-12' : 'h-10 w-10'
      } items-center justify-center rounded-full ${
        hideBg ? '' : 'bg-th-bkg-4'
      } text-th-fgd-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-th-bkg-4 
      disabled:text-th-fgd-4 md:hover:text-th-primary md:disabled:hover:text-th-fgd-4`}
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
  icon,
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
      {icon}
      <span className={icon ? 'ml-2' : ''}>{children}</span>
    </button>
  )
}

export default Button
