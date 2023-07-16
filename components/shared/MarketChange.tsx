import { MinusSmallIcon } from '@heroicons/react/20/solid'
import { DownTriangle, UpTriangle } from './DirectionTriangles'
import FormatNumericValue from './FormatNumericValue'
import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import use24HourChange from 'hooks/use24HourChange'
import { useMemo } from 'react'
import SheenLoader from './SheenLoader'

const MarketChange = ({
  market,
  size,
}: {
  market: PerpMarket | Serum3Market | undefined
  size?: 'small'
}) => {
  const { loading, spotChange, perpChange } = use24HourChange(market)

  const change = useMemo(() => {
    if (!market) return
    return market instanceof PerpMarket ? perpChange : spotChange
  }, [perpChange, spotChange])

  return loading ? (
    <SheenLoader className="mt-0.5">
      <div className="h-3.5 w-12 bg-th-bkg-2" />
    </SheenLoader>
  ) : change && !isNaN(change) ? (
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
        <FormatNumericValue
          value={isNaN(change) ? '0.00' : Math.abs(change)}
          decimals={2}
        />
        %
      </p>
    </div>
  ) : (
    <p>–</p>
  )
}

export default MarketChange
