import { FunctionComponent } from 'react'

interface ButtonGroupProps {
  activeValue: string
  className?: string
  disabled?: boolean
  onChange: (x: any) => void
  unit?: string
  values: Array<any>
  names?: Array<string>
  large?: boolean
}

const ButtonGroup: FunctionComponent<ButtonGroupProps> = ({
  activeValue,
  className,
  disabled,
  unit,
  values,
  onChange,
  names,
  large,
}) => {
  return (
    <div className={`rounded-md bg-th-bkg-2 ${disabled ? 'opacity-50' : ''}`}>
      <div className="relative flex">
        {activeValue && values.includes(activeValue) ? (
          <div
            className={`default-transition absolute left-0 top-0 h-full transform rounded-md bg-th-bkg-3`}
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
            className={`${className} default-transition relative w-1/2 cursor-pointer rounded-md px-3 text-center disabled:cursor-not-allowed ${
              large ? 'h-12 text-sm' : 'h-10 text-xs'
            } font-normal
              ${
                v === activeValue
                  ? `text-th-active`
                  : `text-th-fgd-2 md:hover:text-th-active`
              }
            `}
            disabled={disabled}
            key={`${v}${i}`}
            onClick={() => onChange(v)}
            style={{
              width: `${100 / values.length}%`,
            }}
          >
            {names ? (unit ? names[i] + unit : names[i]) : unit ? v + unit : v}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ButtonGroup
