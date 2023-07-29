import { MinusSmallIcon } from '@heroicons/react/20/solid'
import { DownTriangle, UpTriangle } from './DirectionTriangles'
import FormatNumericValue from './FormatNumericValue'
import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import { useMemo } from 'react'
import SheenLoader from './SheenLoader'
import useMarketsData from 'hooks/useMarketsData'
import mangoStore from '@store/mangoStore'
import { MarketData } from 'types'

const MarketChange = ({
  market,
  size,
}: {
  market: PerpMarket | Serum3Market | undefined
  size?: 'small'
}) => {
  const { data: marketsData, isLoading, isFetching } = useMarketsData()

  const currentSpotPrice = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !market || market instanceof PerpMarket) return 0
    const baseBank = group.getFirstBankByTokenIndex(market.baseTokenIndex)
    const quoteBank = group.getFirstBankByTokenIndex(market.quoteTokenIndex)
    if (!baseBank || !quoteBank) return 0
    return baseBank.uiPrice / quoteBank.uiPrice
  }, [market])

  const change = useMemo(() => {
    if (!market || !marketsData) return
    const isPerp = market instanceof PerpMarket
    let pastPrice = 0
    let dailyVolume = 0
    if (isPerp) {
      const perpData: MarketData = marketsData?.perpData
      const perpEntries = Object.entries(perpData).find(
        (e) => e[0].toLowerCase() === market.name.toLowerCase(),
      )
      pastPrice = perpEntries ? perpEntries[1][0]?.price_24h : 0
      dailyVolume = perpEntries ? perpEntries[1][0]?.quote_volume_24h : 0
    } else {
      const spotData: MarketData = marketsData?.spotData
      const spotEntries = Object.entries(spotData).find(
        (e) => e[0].toLowerCase() === market.name.toLowerCase(),
      )
      pastPrice = spotEntries ? spotEntries[1][0]?.price_24h : 0
      dailyVolume = spotEntries ? spotEntries[1][0]?.quote_volume_24h : 0
    }
    const currentPrice = isPerp ? market.uiPrice : currentSpotPrice
    const change =
      dailyVolume > 0 || isPerp
        ? ((currentPrice - pastPrice) / pastPrice) * 100
        : 0
    return change
  }, [marketsData, currentSpotPrice])

  const loading = isLoading || isFetching

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
