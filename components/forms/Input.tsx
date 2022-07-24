import { ChangeEvent, forwardRef } from 'react'

interface InputProps {
  type: string
  value: any
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  className?: string
  disabled?: boolean
  prefixClassname?: string
  error?: boolean
  [x: string]: any
}

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    type,
    value,
    onChange,
    className,
    error,
    wrapperClassName = 'w-full',
    disabled,
    prefix,
    prefixClassName,
    suffix,
  } = props
  return (
    <div className={`relative flex ${wrapperClassName}`}>
      {prefix ? (
        <div
          className={`absolute left-2 top-1/2 -translate-y-1/2 transform ${prefixClassName}`}
        >
          {prefix}
        </div>
      ) : null}
      <input
        className={`${className} h-12 w-full flex-1 rounded-md border bg-th-bkg-1 px-3 text-base
          text-th-fgd-1 ${
            error ? 'border-th-red' : 'border-th-bkg-4'
          } hover:border-th-fgd-4 
          focus:outline-none 
          ${
            disabled
              ? 'cursor-not-allowed bg-th-bkg-3 text-th-fgd-3 hover:border-th-fgd-4'
              : ''
          }
          ${prefix ? 'pl-8' : ''}
          ${suffix ? 'pr-11' : ''}`}
        disabled={disabled}
        ref={ref}
        {...props}
        type={type}
        value={value}
        onChange={onChange}
      />
      {suffix ? (
        <span className="absolute right-0 flex h-full items-center bg-transparent pr-2 text-xs text-th-fgd-4">
          {suffix}
        </span>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
