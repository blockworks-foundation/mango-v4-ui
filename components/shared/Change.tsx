import { MinusSmallIcon } from '@heroicons/react/20/solid'
import { formatFixedDecimals } from 'utils/numbers'
import { DownTriangle, UpTriangle } from './DirectionTriangles'

const Change = ({
  change,
  isCurrency,
  size,
}: {
  change: number | typeof NaN
  isCurrency?: boolean
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
          size === 'small' ? 'text-xs' : 'text-sm'
        } ${
          change > 0
            ? 'text-th-green'
            : change < 0
            ? 'text-th-red'
            : 'text-th-fgd-4'
        }`}
      >
        {isCurrency ? '$' : ''}
        {isNaN(change)
          ? '0.00'
          : formatFixedDecimals(Math.abs(change), false, true)}
        {!isCurrency ? '%' : ''}
      </p>
    </div>
  )
}

export default Change
