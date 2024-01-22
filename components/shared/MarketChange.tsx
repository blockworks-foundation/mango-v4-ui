import { MinusSmallIcon } from '@heroicons/react/20/solid'
import { DownTriangle, UpTriangle } from './DirectionTriangles'
import FormatNumericValue from './FormatNumericValue'
import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import { useMemo } from 'react'
import SheenLoader from './SheenLoader'
import useListedMarketsWithMarketData from 'hooks/useListedMarketsWithMarketData'

const MarketChange = ({
  market,
  size,
}: {
  market: PerpMarket | Serum3Market | undefined
  size?: 'small'
}) => {
  const { perpMarketsWithData, serumMarketsWithData, isLoading } =
    useListedMarketsWithMarketData()

  const change = useMemo(() => {
    if (!market || !perpMarketsWithData || !serumMarketsWithData) return 0
    const isPerp = market instanceof PerpMarket
    if (isPerp) {
      const perpMarket = perpMarketsWithData.find(
        (m) => m.name.toLowerCase() === market.name.toLowerCase(),
      )
      return perpMarket?.rollingChange ? perpMarket.rollingChange : 0
    } else {
      const spotMarket = serumMarketsWithData.find(
        (m) => m.name.toLowerCase() === market.name.toLowerCase(),
      )
      return spotMarket?.rollingChange ? spotMarket.rollingChange : 0
    }
  }, [perpMarketsWithData, serumMarketsWithData])

  return isLoading ? (
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
    <div className="flex items-center space-x-1.5">
      <MinusSmallIcon
        className={`-mr-1 ${
          size === 'small' ? 'h-4 w-4' : 'h-6 w-6'
        } text-th-fgd-4`}
      />
      <p
        className={`font-mono font-normal ${
          size === 'small' ? 'text-xs' : 'text-sm'
        } text-th-fgd-2`}
      >
        0%
      </p>
    </div>
  )
}

export default MarketChange
