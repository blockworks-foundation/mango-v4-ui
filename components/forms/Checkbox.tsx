import React, { ChangeEvent, ReactNode } from 'react'
import { CheckIcon } from '@heroicons/react/20/solid'

interface CheckboxProps {
  checked: boolean
  children: ReactNode
  onChange: (x: ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  halfState?: boolean
  labelClass?: string
}

const Checkbox = ({
  checked,
  children,
  disabled = false,
  halfState = false,
  labelClass,
  ...props
}: CheckboxProps) => (
  <label className="default-transition flex cursor-pointer items-center text-th-fgd-3 hover:text-th-fgd-2">
    <input
      checked={checked}
      {...props}
      disabled={disabled}
      type="checkbox"
      style={{
        border: '0',
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        padding: '0',
        position: 'absolute',
        whiteSpace: 'nowrap',
        width: '1px',
      }}
    />
    <div
      className={`${
        checked && !disabled && !halfState ? 'bg-th-active' : 'bg-th-bkg-4'
      } default-transition flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded`}
    >
      {halfState ? (
        <div className="mb-0.5 font-bold">–</div>
      ) : (
        <CheckIcon
          className={`${checked ? 'block' : 'hidden'} h-4 w-4 ${
            disabled ? 'text-th-bkg-4' : 'text-th-bkg-1'
          }`}
        />
      )}
    </div>
    <span
      className={`ml-2 whitespace-nowrap text-xs ${labelClass} ${
        checked && !disabled ? 'text-th-fgd-2' : ''
      }`}
    >
      {children}
    </span>
  </label>
)

export default Checkbox
