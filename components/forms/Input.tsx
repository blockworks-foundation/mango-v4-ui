import { ChangeEvent, forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  type?: string
  maxLength?: number
  className?: string
  disabled?: boolean
  heightClass?: string
  prefixClassname?: string
  wrapperClassName?: string
  hasError?: boolean
  prefix?: string
  prefixClassName?: string
  suffix?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    type,
    value,
    onChange,
    maxLength,
    className,
    heightClass,
    hasError,
    wrapperClassName = 'w-full',
    disabled,
    prefix,
    prefixClassName,
    suffix,
  } = props
  return (
    <>
      <div className={`relative flex ${wrapperClassName}`}>
        {prefix ? (
          <div
            className={`absolute left-2 top-1/2 -translate-y-1/2 ${prefixClassName}`}
          >
            {prefix}
          </div>
        ) : null}
        <input
          className={`${className} ${
            heightClass ? heightClass : 'h-12'
          } w-full flex-1 rounded-md border bg-th-input-bkg px-3 text-base
          text-th-fgd-1 ${
            hasError ? 'border-th-down' : 'border-th-input-border'
          } focus:outline-none 
          md:hover:border-th-input-border-hover 
          ${
            disabled
              ? 'cursor-not-allowed bg-th-bkg-3 text-th-fgd-3 hover:border-th-fgd-4'
              : ''
          }
          ${prefix ? 'pl-8' : ''}
          ${suffix ? 'pr-11' : ''}`}
          disabled={disabled}
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          maxLength={maxLength ? maxLength : undefined}
        />
        {suffix ? (
          <span className="absolute right-0 flex h-full items-center bg-transparent pr-2 text-xs text-th-fgd-4">
            {suffix}
          </span>
        ) : null}
        {maxLength ? (
          <p
            className={`absolute -top-7 right-0 mt-1 flex justify-end text-xs ${
              value.length === maxLength ? 'text-th-down' : 'text-th-fgd-4'
            }`}
          >
            {`${value.length}/${maxLength}`}
          </p>
        ) : null}
      </div>
    </>
  )
})

Input.displayName = 'Input'
export default Input
