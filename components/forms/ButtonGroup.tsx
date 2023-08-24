type Values = string | number

interface ButtonGroupProps<T extends Values> {
  activeValue: T
  className?: string
  disabled?: boolean
  onChange: (x: T) => void
  unit?: string
  values: T[]
  names?: Array<string>
  large?: boolean
}

const ButtonGroup = <T extends Values>({
  activeValue,
  className,
  disabled,
  unit,
  values,
  onChange,
  names,
  large,
}: ButtonGroupProps<T>) => {
  return (
    <div className={`rounded-md bg-th-bkg-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="relative flex">
        {activeValue && values.includes(activeValue) ? (
          <div
            className={`absolute left-0 top-0 h-full transform rounded-md bg-th-bkg-4`}
            style={{
              transform: `translateX(${
                values.findIndex((v) => v === activeValue) * 100
              }%)`,
              width: `${100 / values.length}%`,
            }}
          />
        ) : null}
        {values.map((v, i) => (
          <button
            className={`${className} relative w-1/2 cursor-pointer rounded-md px-3 text-center focus-visible:bg-th-bkg-4 focus-visible:text-th-fgd-2 disabled:cursor-not-allowed ${
              large ? 'h-12 text-sm' : 'h-10 text-xs'
            } font-normal
              ${
                v === activeValue
                  ? `text-th-active`
                  : `text-th-fgd-2 md:hover:text-th-fgd-1`
              }
            `}
            disabled={disabled}
            key={`${v}${i}`}
            onClick={() => onChange(v)}
            style={{
              width: `${100 / values.length}%`,
            }}
            type="button"
          >
            {names ? (unit ? names[i] + unit : names[i]) : unit ? v + unit : v}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ButtonGroup
