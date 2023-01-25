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
    <div className="flex items-center justify-between md:block">
      <div className="flex items-center">
        <span className={`pr-2 font-mono text-th-fgd-2`}>
          <FormatNumericValue value={low} isUsd />
        </span>
        <div className="mt-[2px] flex h-2 w-32 rounded-sm bg-th-bkg-3">
          <div
            style={{
              width: `${rangePercent}%`,
            }}
            className="flex rounded-sm bg-th-active"
          ></div>
        </div>
        <span className={`pl-2 font-mono text-th-fgd-2`}>
          <FormatNumericValue value={high} isUsd />
        </span>
      </div>
    </div>
  )
}

export default DailyRange
