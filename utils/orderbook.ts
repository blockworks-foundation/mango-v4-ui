import {
  BookSide,
  BookSideType,
  MangoClient,
  PerpMarket,
} from '@blockworks-foundation/mango-v4'
import { Market, Orderbook as SpotOrderBook } from '@project-serum/serum'
import { AccountInfo } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import Big from 'big.js'
import { cumOrderbookSide } from 'types'
import { getDecimalCount } from './numbers'

export const getMarket = () => {
  const group = mangoStore.getState().group
  const selectedMarket = mangoStore.getState().selectedMarket.current
  if (!group || !selectedMarket) return
  return selectedMarket instanceof PerpMarket
    ? selectedMarket
    : group?.getSerum3ExternalMarket(selectedMarket.serumMarketExternal)
}

export const decodeBookL2 = (book: SpotOrderBook | BookSide): number[][] => {
  const depth = 300
  if (book instanceof SpotOrderBook) {
    return book.getL2(depth).map(([price, size]) => [price, size])
  } else if (book instanceof BookSide) {
    return book.getL2Ui(depth)
  }
  return []
}

export function decodeBook(
  client: MangoClient,
  market: Market | PerpMarket,
  accInfo: AccountInfo<Buffer>,
  side: 'bids' | 'asks',
): SpotOrderBook | BookSide {
  if (market instanceof Market) {
    const book = SpotOrderBook.decode(market, accInfo.data)
    return book
  } else {
    const decodedAcc = client.program.coder.accounts.decode(
      'bookSide',
      accInfo.data,
    )
    const book = BookSide.from(
      client,
      market,
      side === 'bids' ? BookSideType.bids : BookSideType.asks,
      decodedAcc,
    )
    return book
  }
}

export const updatePerpMarketOnGroup = (
  book: BookSide,
  side: 'bids' | 'asks',
) => {
  const group = mangoStore.getState().group
  const perpMarket = group?.getPerpMarketByMarketIndex(
    book.perpMarket.perpMarketIndex,
  )
  if (perpMarket) {
    perpMarket[`_${side}`] = book
    // mangoStore.getState().actions.fetchOpenOrders()
  }
}

export const hasOpenOrderForPriceGroup = (
  openOrderPrices: number[],
  price: number,
  grouping: number,
  isGrouped: boolean,
  side: 'bids' | 'asks',
) => {
  if (!isGrouped) {
    return !!openOrderPrices.find((ooPrice) => {
      return ooPrice === price
    })
  }
  return !!openOrderPrices.find((ooPrice) => {
    if (side === 'bids') {
      return ooPrice >= price - grouping && ooPrice < price
    } else {
      return ooPrice <= price + grouping && ooPrice > price
    }
  })
}

export const getCumulativeOrderbookSide = (
  orders: number[][],
  totalSize: number,
  maxSize: number,
  depth: number,
  usersOpenOrderPrices: number[],
  grouping: number,
  isGrouped: boolean,
  side: 'bids' | 'asks',
): cumOrderbookSide[] => {
  let cumulativeSize = 0
  let cumulativeValue = 0
  return orders.slice(0, depth).map(([price, size]) => {
    cumulativeSize += size
    cumulativeValue += price * size
    return {
      price: Number(price),
      size,
      averagePrice: cumulativeValue / cumulativeSize,
      cumulativeValue: cumulativeValue,
      cumulativeSize,
      sizePercent: Math.round((cumulativeSize / (totalSize || 1)) * 100),
      cumulativeSizePercent: Math.round((size / (cumulativeSize || 1)) * 100),
      maxSizePercent: Math.round((size / (maxSize || 1)) * 100),
      isUsersOrder: hasOpenOrderForPriceGroup(
        usersOpenOrderPrices,
        price,
        grouping,
        isGrouped,
        side,
      ),
    }
  })
}

export const groupBy = (
  ordersArray: number[][] | undefined,
  market: PerpMarket | Market,
  grouping: number,
  isBids: boolean,
) => {
  if (!ordersArray || !market || !grouping || grouping == market?.tickSize) {
    return ordersArray || []
  }
  const groupFloors: Record<number, number> = {}
  for (let i = 0; i < ordersArray.length; i++) {
    if (typeof ordersArray[i] == 'undefined') {
      break
    }
    const bigGrouping = Big(grouping)
    const bigOrder = Big(ordersArray[i][0])

    const floor = isBids
      ? bigOrder
          .div(bigGrouping)
          .round(0, Big.roundDown)
          .times(bigGrouping)
          .toNumber()
      : bigOrder
          .div(bigGrouping)
          .round(0, Big.roundUp)
          .times(bigGrouping)
          .toNumber()
    if (typeof groupFloors[floor] == 'undefined') {
      groupFloors[floor] = ordersArray[i][1]
    } else {
      groupFloors[floor] = ordersArray[i][1] + groupFloors[floor]
    }
  }
  const sortedGroups = Object.entries(groupFloors)
    .map((entry) => {
      return [
        +parseFloat(entry[0]).toFixed(getDecimalCount(grouping)),
        entry[1],
      ]
    })
    .sort((a: number[], b: number[]) => {
      if (!a || !b) {
        return -1
      }
      return isBids ? b[0] - a[0] : a[0] - b[0]
    })
  return sortedGroups
}

export const formatOrderbookData = (
  rawBids: number[][] | undefined,
  rawAsks: number[][] | undefined,
  depth: 12 | 30,
  market: PerpMarket | Market,
  grouping: number,
  usersOpenOrderPrices: number[],
) => {
  const bids = groupBy(rawBids, market, grouping, true) || []
  const asks = groupBy(rawAsks, market, grouping, false) || []

  const sum = (total: number, [, size]: number[], index: number) =>
    index < depth ? total + size : total
  const totalSize = bids.reduce(sum, 0) + asks.reduce(sum, 0)

  const maxSize =
    Math.max(
      ...bids.map((b: number[]) => {
        return b[1]
      }),
    ) +
    Math.max(
      ...asks.map((a: number[]) => {
        return a[1]
      }),
    )
  const isGrouped = grouping !== market.tickSize
  const bidsToDisplay = getCumulativeOrderbookSide(
    bids,
    totalSize,
    maxSize,
    depth,
    usersOpenOrderPrices,
    grouping,
    isGrouped,
    'bids',
  )
  const asksToDisplay = getCumulativeOrderbookSide(
    asks,
    totalSize,
    maxSize,
    depth,
    usersOpenOrderPrices,
    grouping,
    isGrouped,
    'asks',
  )

  if (bidsToDisplay[0] || asksToDisplay[0]) {
    const bid = bidsToDisplay[0]?.price
    const ask = asksToDisplay[0]?.price
    let spread = 0,
      spreadPercentage = 0
    if (bid && ask) {
      spread = parseFloat((ask - bid).toFixed(getDecimalCount(market.tickSize)))
      spreadPercentage = (spread / ask) * 100
    }

    return {
      bids: bidsToDisplay,
      asks: asksToDisplay.reverse(),
      spread,
      spreadPercentage,
    }
  } else {
    return null
  }
}
