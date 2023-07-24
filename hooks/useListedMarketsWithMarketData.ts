import { MarketData, MarketsDataItem } from 'types'
import useMarketsData from './useMarketsData'
import { useMemo } from 'react'
import mangoStore from '@store/mangoStore'
import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'

type ApiData = {
  marketData: MarketsDataItem | undefined
}

export type SerumMarketWithMarketData = Serum3Market & ApiData

export type PerpMarketWithMarketData = PerpMarket & ApiData

export default function useListedMarketsWithMarketData() {
  const { data: marketsData, isLoading, isFetching } = useMarketsData()
  const serumMarkets = mangoStore((s) => s.serumMarkets)
  const perpMarkets = mangoStore((s) => s.perpMarkets)

  const perpData: MarketData = useMemo(() => {
    if (!marketsData) return []
    return marketsData?.perpData || []
  }, [marketsData])

  const spotData: MarketData = useMemo(() => {
    if (!marketsData) return []
    return marketsData?.spotData || []
  }, [marketsData])

  const serumMarketsWithData = useMemo(() => {
    if (!serumMarkets || !serumMarkets.length) return []
    const allSpotMarkets: SerumMarketWithMarketData[] =
      serumMarkets as SerumMarketWithMarketData[]
    if (spotData) {
      for (const market of allSpotMarkets) {
        const spotEntries = Object.entries(spotData).find(
          (e) => e[0].toLowerCase() === market.name.toLowerCase(),
        )
        market.marketData = spotEntries ? spotEntries[1][0] : undefined
      }
    }
    return [...allSpotMarkets].sort((a, b) => a.name.localeCompare(b.name))
  }, [spotData, serumMarkets])

  const perpMarketsWithData = useMemo(() => {
    if (!perpMarkets || !perpMarkets.length) return []
    const allPerpMarkets: PerpMarketWithMarketData[] =
      perpMarkets as PerpMarketWithMarketData[]
    if (perpData) {
      for (const market of allPerpMarkets) {
        const perpEntries = Object.entries(perpData).find(
          (e) => e[0].toLowerCase() === market.name.toLowerCase(),
        )
        market.marketData = perpEntries ? perpEntries[1][0] : undefined
      }
    }
    return allPerpMarkets
      .filter(
        (p) =>
          p.publicKey.toString() !==
          '9Y8paZ5wUpzLFfQuHz8j2RtPrKsDtHx9sbgFmWb5abCw',
      )
      .sort((a, b) =>
        a.oracleLastUpdatedSlot == 0 ? -1 : a.name.localeCompare(b.name),
      )
  }, [perpData, perpMarkets])

  return { perpMarketsWithData, serumMarketsWithData, isLoading, isFetching }
}
