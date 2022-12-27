import { ChangeEvent, forwardRef } from 'react'

interface InputProps {
  type: string
  value: any
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  charLimit?: number
  className?: string
  disabled?: boolean
  prefixClassname?: string
  wrapperClassName?: string
  error?: boolean
  prefix: string
  prefixClassName: string
  suffix: string
  [x: string]: any
}

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    type,
    value,
    onChange,
    charLimit,
    className,
    error,
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
          {...props}
          className={`${className} default-transition h-12 w-full flex-1 rounded-md border bg-th-input-bkg px-3 text-base
          text-th-fgd-1 ${
            error ? 'border-th-down' : 'border-th-input-border'
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
          maxLength={charLimit && charLimit}
        />
        {suffix ? (
          <span className="absolute right-0 flex h-full items-center bg-transparent pr-2 text-xs text-th-fgd-4">
            {suffix}
          </span>
        ) : null}
        {charLimit ? (
          <p
            className={`absolute -top-7 right-0 mt-1 flex justify-end text-xs ${
              value.length === charLimit ? 'text-th-down' : 'text-th-fgd-4'
            }`}
          >
            {`${value.length}/${charLimit}`}
          </p>
        ) : null}
      </div>
    </>
  )
})

Input.displayName = 'Input'
export default Input
