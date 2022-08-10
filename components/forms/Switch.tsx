import { FunctionComponent, ReactNode, memo } from 'react'

interface SwitchProps {
  checked: boolean
  className?: string
  onChange: (x: boolean) => void
  children: ReactNode
  disabled?: boolean
}

const Switch: FunctionComponent<SwitchProps> = ({
  checked = false,
  className = '',
  children,
  onChange,
  disabled,
}) => {
  const handleClick = () => {
    onChange(!checked)
  }

  return (
    <div className={`flex items-center ${className}`}>
      <span className="mr-2 text-xs text-th-fgd-1">{children}</span>
      <button
        type="button"
        className={`${
          checked ? 'bg-th-primary' : 'bg-th-bkg-button'
        } relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full 
        border-2 border-transparent transition-colors duration-200 ease-in-out 
        focus:outline-none ${disabled ? 'opacity-60' : ''}`}
        role="switch"
        aria-checked={checked}
        onClick={handleClick}
        disabled={disabled}
      >
        <span className="sr-only">{children}</span>
        <span
          aria-hidden="true"
          className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-4 w-4 transform rounded-full 
          bg-white shadow ring-0 transition duration-200 ease-in-out`}
        ></span>
      </button>
    </div>
  )
}

export default memo(Switch)
