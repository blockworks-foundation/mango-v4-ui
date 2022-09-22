import { MinusSmallIcon } from '@heroicons/react/20/solid'
import { DownTriangle, UpTriangle } from './DirectionTriangles'

const PercentageChange = ({
  change,
  size,
}: {
  change: number | typeof NaN
  size?: 'small'
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
          size === 'small' ? 'text-xs' : ''
        } ${
          change > 0
            ? 'text-th-green'
            : change < 0
            ? 'text-th-red'
            : 'text-th-fgd-4'
        }`}
      >
        {isNaN(change) ? '0.00' : Math.abs(change).toFixed(2)}%
      </p>
    </div>
  )
}

export default PercentageChange
