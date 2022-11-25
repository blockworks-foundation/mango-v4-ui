import mangoStore from '@store/mangoStore'
import { useEffect } from 'react'

export default function useMarkPrice() {
  const set = mangoStore((s) => s.set)
  const markPrice = mangoStore((s) => s.selectedMarket.markPrice)
  const orderbook = mangoStore((s) => s.selectedMarket.orderbook)
  const fills = mangoStore((s) => s.selectedMarket.fills)

  const trades = fills
    .filter((trade: any) => trade?.eventFlags?.maker || trade?.maker)
    .map((trade: any) => ({
      ...trade,
      side: trade.side === 'buy' ? 'sell' : 'buy',
    }))

  useEffect(() => {
    const bb = orderbook?.bids?.length > 0 && Number(orderbook.bids[0][0])
    const ba = orderbook?.asks?.length > 0 && Number(orderbook.asks[0][0])
    const last = trades && trades.length > 0 && trades[0].price

    const priceElements = [bb, ba, last].filter((e) => e).sort((a, b) => a - b)
    const newMarkPrice = priceElements.length
      ? priceElements[Math.floor(priceElements.length / 2)]
      : null
    if (newMarkPrice !== markPrice) {
      set((state) => {
        state.selectedMarket.markPrice = newMarkPrice
      })
    }
  }, [orderbook, trades])

  return markPrice
}
