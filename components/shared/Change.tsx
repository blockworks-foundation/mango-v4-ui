import { MinusSmallIcon } from '@heroicons/react/20/solid'
import { formatDecimal } from 'utils/numbers'
import { DownTriangle, UpTriangle } from './DirectionTriangles'

const Change = ({
  change,
  prefix,
  size,
  suffix,
}: {
  change: number | typeof NaN
  prefix?: string
  size?: 'small'
  suffix?: string
}) => {
  return (
    <div className="flex items-center space-x-1.5">
      {change > 0 ? (
        <div className="mt-[1px]">
          <UpTriangle size={size} />
        </div>
      ) : change < 0 ? (
        <div className="mt-[1px]">
          <DownTriangle size={size} />
        </div>
      ) : (
        <MinusSmallIcon
          className={`-mr-1 ${
            size === 'small' ? 'h-4 w-4' : 'h-6 w-6'
          } text-th-fgd-4`}
        />
      )}
      <p
        className={`font-mono font-normal ${
          size === 'small' ? 'text-xs' : 'text-sm'
        } ${
          change > 0
            ? 'text-th-up'
            : change < 0
            ? 'text-th-down'
            : 'text-th-fgd-4'
        }`}
      >
        {prefix ? prefix : ''}
        {isNaN(change) ? '0.00' : formatDecimal(Math.abs(change), 2)}
        {suffix ? suffix : ''}
      </p>
    </div>
  )
}

export default Change
