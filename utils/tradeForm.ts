import { OrderbookL2 } from 'types'

export const calculateLimitPriceForMarketOrder = (
  orderBook: OrderbookL2,
  size: number,
  side: 'buy' | 'sell',
): number => {
  const orders = side === 'buy' ? orderBook.asks : orderBook.bids
  let acc = 0
  let selectedOrder
  const orderSize = size
  for (const order of orders) {
    acc += order[1]
    if (acc >= orderSize) {
      selectedOrder = order
      break
    }
  }

  if (!selectedOrder) {
    throw new Error(
      'Unable to place market order for this order size. Please retry.',
    )
  }

  if (side === 'buy') {
    return selectedOrder[0] * 1.05
  } else {
    return selectedOrder[0] * 0.95
  }
}

export const calculateEstPriceForBaseSize = (
  orderBook: OrderbookL2,
  size: number,
  side: 'buy' | 'sell',
): number => {
  const orders = side === 'buy' ? orderBook.asks : orderBook.bids
  let acc = 0
  let selectedOrder
  const orderSize = size
  for (const order of orders) {
    acc += order[1]
    if (acc >= orderSize) {
      selectedOrder = order
      break
    }
  }

  if (!selectedOrder) {
    throw new Error('Unable to calculate market order. Please retry.')
  }

  if (side === 'buy') {
    return selectedOrder[0]
  } else {
    return selectedOrder[0]
  }
}

export const calculateSlippage = (
  orderBook: OrderbookL2,
  size: number,
  side: 'buy' | 'sell',
  markPrice: number,
): number => {
  const bb = orderBook?.bids?.length > 0 && Number(orderBook.bids[0][0])
  const ba = orderBook?.asks?.length > 0 && Number(orderBook.asks[0][0])
  const referencePrice = bb && ba ? (bb + ba) / 2 : markPrice

  if (Number(size)) {
    const estimatedPrice = calculateEstPriceForBaseSize(
      orderBook,
      Number(size),
      side,
    )

    const slippageAbs =
      Number(size) > 0 ? Math.abs(estimatedPrice - referencePrice) : 0

    const slippageRel = (slippageAbs / referencePrice) * 100
    return slippageRel
  }
  return 0
}
