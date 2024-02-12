import { Bank, Serum3Market } from '@blockworks-foundation/mango-v4'
import {
  PerpMarketWithMarketData,
  SerumMarketWithMarketData,
} from 'hooks/useListedMarketsWithMarketData'
import { NextRouter } from 'next/router'

export type AllowedKeys =
  | 'notionalQuoteVolume'
  | 'quote_volume_24h'
  | 'quote_volume_1h'
  | 'change_24h'
  | 'change_1h'

export const sortSpotMarkets = (
  spotMarkets: SerumMarketWithMarketData[],
  sortByKey: AllowedKeys,
) => {
  return spotMarkets.sort(
    (a: SerumMarketWithMarketData, b: SerumMarketWithMarketData) => {
      const aValue: number | undefined = a?.marketData?.[sortByKey]
      const bValue: number | undefined = b?.marketData?.[sortByKey]

      // Handle marketData[sortByKey] is undefined
      if (typeof aValue === 'undefined' && typeof bValue === 'undefined') {
        return 0 // Consider them equal
      }
      if (typeof aValue === 'undefined') {
        return 1 // b should come before a
      }
      if (typeof bValue === 'undefined') {
        return -1 // a should come before b
      }

      return bValue - aValue
    },
  )
}

export const sortPerpMarkets = (
  perpMarkets: PerpMarketWithMarketData[],
  sortByKey: AllowedKeys,
) => {
  return perpMarkets.sort(
    (a: PerpMarketWithMarketData, b: PerpMarketWithMarketData) => {
      const aValue: number | undefined = a?.marketData?.[sortByKey]
      const bValue: number | undefined = b?.marketData?.[sortByKey]

      // Handle marketData[sortByKey] is undefined
      if (typeof aValue === 'undefined' && typeof bValue === 'undefined') {
        return 0 // Consider them equal
      }
      if (typeof aValue === 'undefined') {
        return 1 // b should come before a
      }
      if (typeof bValue === 'undefined') {
        return -1 // a should come before b
      }

      return bValue - aValue
    },
  )
}

const generateSearchTerm = (
  item: SerumMarketWithMarketData,
  searchValue: string,
) => {
  const normalizedSearchValue = searchValue.toLowerCase()
  const value = item.name.toLowerCase()

  const isMatchingWithName =
    item.name.toLowerCase().indexOf(normalizedSearchValue) >= 0
  const matchingSymbolPercent = isMatchingWithName
    ? normalizedSearchValue.length / item.name.length
    : 0

  return {
    token: item,
    matchingIdx: value.indexOf(normalizedSearchValue),
    matchingSymbolPercent,
  }
}

export const startSearch = (
  items: SerumMarketWithMarketData[],
  searchValue: string,
) => {
  return items
    .map((item) => generateSearchTerm(item, searchValue))
    .filter((item) => item.matchingIdx >= 0)
    .sort((i1, i2) => i1.matchingIdx - i2.matchingIdx)
    .sort((i1, i2) => i2.matchingSymbolPercent - i1.matchingSymbolPercent)
    .map((item) => item.token)
}

export const handleGoToTradePage = (
  bank: Bank | undefined,
  spotMarkets: Serum3Market[],
  router: NextRouter,
) => {
  const markets = spotMarkets.filter(
    (m) => m.baseTokenIndex === bank?.tokenIndex,
  )
  if (markets) {
    if (markets.length === 1) {
      router.push(`/trade?name=${markets[0].name}`)
    }
    if (markets.length > 1) {
      const market = markets.find((mkt) => !mkt.reduceOnly)
      if (market) {
        router.push(`/trade?name=${market.name}`)
      }
    }
  }
}
