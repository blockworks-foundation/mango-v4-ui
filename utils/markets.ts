import {
  PerpMarketWithMarketData,
  SerumMarketWithMarketData,
} from 'hooks/useListedMarketsWithMarketData'

export type AllowedKeys =
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
