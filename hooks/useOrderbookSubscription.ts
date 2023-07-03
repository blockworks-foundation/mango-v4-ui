import { BookSide, PerpMarket } from '@blockworks-foundation/mango-v4'
import { Market } from '@project-serum/serum'
import mangoStore from '@store/mangoStore'
import Big from 'big.js'
import { useEffect, useRef, useState } from 'react'
import { getDecimalCount } from 'utils/numbers'
import useSelectedMarket from './useSelectedMarket'
import { OrderbookL2 } from 'types'
import isEqual from 'lodash/isEqual'

export type cumOrderbookSide = {
  price: number
  size: number
  cumulativeSize: number
  sizePercent: number
  maxSizePercent: number
  cumulativeSizePercent: number
  isUsersOrder: boolean
}

type OrderbookData = {
  bids: cumOrderbookSide[]
  asks: cumOrderbookSide[]
  spread: number
  spreadPercentage: number
}

const getCumulativeOrderbookSide = (
  orders: number[][],
  totalSize: number,
  maxSize: number,
  depth: number,
  usersOpenOrderPrices: number[],
  grouping: number,
  isGrouped: boolean
): cumOrderbookSide[] => {
  let cumulativeSize = 0
  return orders.slice(0, depth).map(([price, size]) => {
    cumulativeSize += size
    return {
      price: Number(price),
      size,
      cumulativeSize,
      sizePercent: Math.round((cumulativeSize / (totalSize || 1)) * 100),
      cumulativeSizePercent: Math.round((size / (cumulativeSize || 1)) * 100),
      maxSizePercent: Math.round((size / (maxSize || 1)) * 100),
      isUsersOrder: hasOpenOrderForPriceGroup(
        usersOpenOrderPrices,
        price,
        grouping,
        isGrouped
      ),
    }
  })
}

const groupBy = (
  ordersArray: number[][],
  market: PerpMarket | Market,
  grouping: number,
  isBids: boolean
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

const hasOpenOrderForPriceGroup = (
  openOrderPrices: number[],
  price: number,
  grouping: number,
  isGrouped: boolean
) => {
  if (!isGrouped) {
    return !!openOrderPrices.find((ooPrice) => {
      return ooPrice === price
    })
  }
  return !!openOrderPrices.find((ooPrice) => {
    return ooPrice >= price - grouping && ooPrice <= price + grouping
  })
}

const useOrderbookSubscription = (
  depth: number,
  grouping: number,
  isScrolled: boolean,
  centerVertically: () => void
) => {
  const { serumOrPerpMarket } = useSelectedMarket()
  const [orderbookData, setOrderbookData] = useState<OrderbookData | null>(null)
  const currentOrderbookData = useRef<OrderbookL2>()

  useEffect(
    () =>
      mangoStore.subscribe(
        (state) => state.selectedMarket.orderbook,
        (newOrderbook) => {
          if (
            newOrderbook &&
            serumOrPerpMarket &&
            !isEqual(currentOrderbookData.current, newOrderbook)
          ) {
            // check if user has open orders so we can highlight them on orderbook
            const openOrders = mangoStore.getState().mangoAccount.openOrders
            const marketPk = serumOrPerpMarket.publicKey.toString()
            const bids2 = mangoStore.getState().selectedMarket.bidsAccount
            const asks2 = mangoStore.getState().selectedMarket.asksAccount
            const mangoAccount = mangoStore.getState().mangoAccount.current
            let usersOpenOrderPrices: number[] = []
            if (
              mangoAccount &&
              bids2 &&
              asks2 &&
              bids2 instanceof BookSide &&
              asks2 instanceof BookSide
            ) {
              usersOpenOrderPrices = [...bids2.items(), ...asks2.items()]
                .filter((order) => order.owner.equals(mangoAccount.publicKey))
                .map((order) => order.price)
            } else {
              usersOpenOrderPrices =
                marketPk && openOrders[marketPk]?.length
                  ? openOrders[marketPk]?.map((order) => order.price)
                  : []
            }

            // updated orderbook data
            const bids =
              groupBy(newOrderbook?.bids, serumOrPerpMarket, grouping, true) ||
              []
            const asks =
              groupBy(newOrderbook?.asks, serumOrPerpMarket, grouping, false) ||
              []

            const sum = (total: number, [, size]: number[], index: number) =>
              index < depth ? total + size : total
            const totalSize = bids.reduce(sum, 0) + asks.reduce(sum, 0)

            const maxSize =
              Math.max(
                ...bids.map((b: number[]) => {
                  return b[1]
                })
              ) +
              Math.max(
                ...asks.map((a: number[]) => {
                  return a[1]
                })
              )
            const isGrouped = grouping !== serumOrPerpMarket.tickSize
            const bidsToDisplay = getCumulativeOrderbookSide(
              bids,
              totalSize,
              maxSize,
              depth,
              usersOpenOrderPrices,
              grouping,
              isGrouped
            )
            const asksToDisplay = getCumulativeOrderbookSide(
              asks,
              totalSize,
              maxSize,
              depth,
              usersOpenOrderPrices,
              grouping,
              isGrouped
            )

            currentOrderbookData.current = newOrderbook
            if (bidsToDisplay[0] || asksToDisplay[0]) {
              const bid = bidsToDisplay[0]?.price
              const ask = asksToDisplay[0]?.price
              let spread = 0,
                spreadPercentage = 0
              if (bid && ask) {
                spread = parseFloat(
                  (ask - bid).toFixed(
                    getDecimalCount(serumOrPerpMarket.tickSize)
                  )
                )
                spreadPercentage = (spread / ask) * 100
              }

              setOrderbookData({
                bids: bidsToDisplay,
                asks: asksToDisplay.reverse(),
                spread,
                spreadPercentage,
              })
              if (!isScrolled) {
                centerVertically()
              }
            } else {
              setOrderbookData(null)
            }
          }
        }
      ),
    [grouping, serumOrPerpMarket, isScrolled, centerVertically]
  )
  return orderbookData
}

export default useOrderbookSubscription
