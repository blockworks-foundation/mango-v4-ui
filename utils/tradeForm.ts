import { Orderbook } from 'types'

export const calculateMarketPrice = (
  orderBook: Orderbook,
  size: number,
  side: 'buy' | 'sell',
  baseOrQuote: 'base' | 'quote'
): number => {
  const orders = side === 'buy' ? orderBook.asks : orderBook.bids
  let acc = 0
  let selectedOrder
  let orderSize = size
  for (const order of orders) {
    acc += order[1]
    if (baseOrQuote === 'quote') {
      orderSize = size / acc
    }
    if (acc >= orderSize) {
      selectedOrder = order
      break
    }
  }

  if (!selectedOrder) {
    throw new Error('Unable to calculate market order. Please retry.')
  }

  if (side === 'buy') {
    return selectedOrder[0] * 1.05
  } else {
    return selectedOrder[0] * 0.95
  }
}
