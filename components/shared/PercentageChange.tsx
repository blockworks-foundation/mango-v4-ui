import { DownTriangle, UpTriangle } from './DirectionTriangles'

const PercentageChange = ({ change }: { change: number | typeof NaN }) => {
  return (
    <div className="mt-1 flex items-center space-x-2">
      {change > 0 ? <UpTriangle /> : change < 0 ? <DownTriangle /> : ''}
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
