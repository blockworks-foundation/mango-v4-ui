import { MinusIcon, MinusSmallIcon } from '@heroicons/react/20/solid'
import { DownTriangle, UpTriangle } from './DirectionTriangles'

const PercentageChange = ({ change }: { change: number | typeof NaN }) => {
  return (
    <div className="flex items-center space-x-1.5">
      {change > 0 ? (
        <UpTriangle />
      ) : change < 0 ? (
        <DownTriangle />
      ) : (
        <MinusSmallIcon className="-mr-1 h-6 w-6 text-th-fgd-4" />
      )}
      <p
        className={`font-normal ${
          change > 0
            ? 'text-th-green'
            : change < 0
            ? 'text-th-red'
            : 'text-th-fgd-4'
        }`}
      >
        {isNaN(change) ? '0.00' : change.toFixed(2)}%
      </p>
    </div>
  )
}

export default PercentageChange
