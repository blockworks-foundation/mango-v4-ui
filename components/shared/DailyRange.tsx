import { useMemo } from 'react'
import FormatNumericValue from './FormatNumericValue'

interface DailyRangeProps {
  high: number
  low: number
  price: number
}

const DailyRange = ({ high, low, price }: DailyRangeProps) => {
  const rangePercent = useMemo(() => {
    return ((price - low) * 100) / (high - low)
  }, [high, low, price])

  return (
    <div className="flex w-full items-center justify-between sm:w-auto md:block">
      <div className="flex w-full flex-col sm:w-auto sm:flex-row sm:items-center">
        <span className={`mb-1 pr-2 font-mono text-th-fgd-2 sm:mb-0`}>
          <FormatNumericValue value={low} isUsd />
        </span>
        <div className="mt-[1px] flex h-2 w-full rounded-sm bg-th-bkg-3 sm:w-32">
          <div
            style={{
              width: `${rangePercent}%`,
            }}
            className="flex rounded-sm bg-th-active"
          ></div>
        </div>
        <span
          className={`mt-1 flex justify-end pl-2 font-mono text-th-fgd-2 sm:mt-0`}
        >
          <FormatNumericValue value={high} isUsd />
        </span>
      </div>
    </div>
  )
}

export default DailyRange
