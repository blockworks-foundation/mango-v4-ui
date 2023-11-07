import { MinusSmallIcon } from '@heroicons/react/20/solid'
import { DownTriangle, UpTriangle } from './DirectionTriangles'
import FormatNumericValue from './FormatNumericValue'

const Change = ({
  change,
  decimals,
  isPrivate,
  prefix,
  size,
  suffix,
}: {
  change: number | typeof NaN
  decimals?: number
  isPrivate?: boolean
  prefix?: string
  size?: 'small' | 'large'
  suffix?: string
}) => {
  return !isNaN(change) ? (
    <div className="flex items-center space-x-1.5">
      {change > 0 ? (
        <div className="mt-[1px]">
          <UpTriangle size={size} />
        </div>
      ) : change < 0 ? (
        <div className="mt-[1px]">
          <DownTriangle size={size} />
        </div>
      ) : null}
      <p
        className={`font-mono font-normal ${
          size === 'small'
            ? 'text-xs'
            : size === 'large'
            ? 'text-base'
            : 'text-sm'
        } ${
          change > 0
            ? 'text-th-up'
            : change < 0
            ? 'text-th-down'
            : 'text-th-fgd-2'
        }`}
      >
        {prefix ? prefix : ''}
        <FormatNumericValue
          value={isNaN(change) ? '0.00' : Math.abs(change)}
          decimals={decimals ? decimals : 2}
          isPrivate={isPrivate}
        />
        {suffix ? suffix : ''}
      </p>
    </div>
  ) : (
    <div className="flex items-center space-x-1.5">
      <MinusSmallIcon
        className={`-mr-1 ${
          size === 'small' ? 'h-4 w-4' : 'h-6 w-6'
        } text-th-fgd-4`}
      />
      <p
        className={`font-mono font-normal ${
          size === 'small'
            ? 'text-xs'
            : size === 'large'
            ? 'text-base'
            : 'text-sm'
        }`}
      >
        {prefix ? prefix : ''}
        <FormatNumericValue
          value="0.00"
          decimals={decimals ? decimals : 2}
          isPrivate={isPrivate}
        />
        {suffix ? suffix : ''}
      </p>
    </div>
  )
}

export default Change
