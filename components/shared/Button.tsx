import mangoStore from '@store/mangoStore'
import { useTheme } from 'next-themes'
import { forwardRef, FunctionComponent, ReactNode, Ref } from 'react'

interface AllButtonProps {
  onClick?: (e?: React.MouseEvent) => void
  disabled?: boolean
  className?: string
  secondary?: boolean
  children?: ReactNode
}

interface ButtonProps {
  size?: 'large' | 'medium' | 'small'
  type?: 'button' | 'submit'
}

type ButtonCombinedProps = AllButtonProps & ButtonProps

const Button: FunctionComponent<ButtonCombinedProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  secondary,
  size = 'medium',
  type = 'button',
  ...props
}) => {
  const { theme } = useTheme()
  const themeData = mangoStore((s) => s.themeData)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md ${
        themeData.buttonStyle === 'raised'
          ? 'raised-button group relative top-0 after:rounded-md'
          : secondary
          ? 'border border-th-button focus-visible:border-th-fgd-4 md:hover:border-th-button-hover'
          : 'bg-th-button focus-visible:border focus-visible:border-th-fgd-4 md:hover:bg-th-button-hover'
      } ${
        size === 'medium'
          ? 'h-10 px-4'
          : size === 'large'
          ? 'h-12 px-6'
          : 'h-8 px-3'
      } font-display ${
        theme === 'High Contrast' && !secondary
          ? 'text-th-bkg-1'
          : 'text-th-fgd-1'
      } disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      type={type}
      {...props}
    >
      <span
        className={`flex items-center justify-center ${
          themeData.buttonStyle === 'raised'
            ? 'group-hover:mt-1 group-active:mt-2'
            : ''
        }`}
      >
        {children}
      </span>
    </button>
  )
}

interface IconButtonProps {
  hideBg?: boolean
  size?: 'small' | 'medium' | 'large'
  ref?: Ref<HTMLButtonElement>
}

type IconButtonCombinedProps = AllButtonProps & IconButtonProps

export const IconButton = forwardRef<
  HTMLButtonElement,
  IconButtonCombinedProps
>((props, ref) => {
  const { children, onClick, disabled = false, className, hideBg, size } = props
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex shrink-0 ${
        size === 'large'
          ? 'h-12 w-12'
          : size === 'small'
          ? 'h-8 w-8'
          : size === 'medium'
          ? 'h-10 w-10'
          : ''
      } items-center justify-center rounded-full ${
        hideBg
          ? 'md:hover:text-th-active'
          : 'border border-th-button focus-visible:border-th-fgd-3 md:hover:border-th-button-hover'
      } text-th-fgd-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-th-bkg-4 
      disabled:text-th-fgd-4 md:disabled:hover:text-th-fgd-4 ${className} focus-visible:text-th-active`}
      ref={ref}
    >
      {children}
    </button>
  )
})

IconButton.displayName = 'IconButton'

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
        secondary ? 'text-th-active' : 'text-th-fgd-2'
      } rounded-sm focus-visible:text-th-active focus-visible:underline disabled:cursor-not-allowed disabled:opacity-50 ${className} md:hover:text-th-fgd-3`}
      {...props}
      type="button"
    >
      {children}
    </button>
  )
}

export default Button
