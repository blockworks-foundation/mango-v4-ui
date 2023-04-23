import { FunctionComponent } from 'react'

interface ChartRangeButtonsProps {
  activeValue: string
  className?: string
  onChange: (x: string) => void
  values: Array<string>
  names?: Array<string>
}

const ChartRangeButtons: FunctionComponent<ChartRangeButtonsProps> = ({
  activeValue,
  className,
  values,
  onChange,
  names,
}) => {
  return (
    <div className="relative flex">
      {activeValue && values.includes(activeValue) ? (
        <div
          className="default-transition absolute left-0 top-0 h-full transform rounded-md bg-th-bkg-3"
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
          className={`${className} default-transition relative h-6 cursor-pointer rounded-md px-3 text-center text-xs focus:bg-th-bkg-3 focus:text-th-fgd-1
              ${
                v === activeValue
                  ? `text-th-active`
                  : `text-th-fgd-3 md:hover:text-th-active`
              }
            `}
          key={`${v}${i}`}
          onClick={() => onChange(v)}
          style={{
            width: `${100 / values.length}%`,
          }}
        >
          {names ? names[i] : v}
        </button>
      ))}
    </div>
  )
}

export default ChartRangeButtons
