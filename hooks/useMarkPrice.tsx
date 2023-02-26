import mangoStore from '@store/mangoStore'
import { useEffect } from 'react'

const set = mangoStore.getState().set

export default function useMarkPrice() {
  const markPrice = mangoStore((s) => s.selectedMarket.markPrice)
  const orderbook = mangoStore((s) => s.selectedMarket.orderbook)
  const fills = mangoStore((s) => s.selectedMarket.fills)

  useEffect(() => {
    const bb = orderbook?.bids?.length > 0 && Number(orderbook.bids[0][0])
    const ba = orderbook?.asks?.length > 0 && Number(orderbook.asks[0][0])
    const last = fills && fills.length > 0 && fills[0].price

    if (bb && ba && last) {
      const priceElements = [bb, ba, last]
        .filter((e) => e)
        .sort((a, b) => a - b)
      const newMarkPrice = priceElements.length
        ? priceElements[Math.floor(priceElements.length / 2)]
        : null
      if (newMarkPrice && newMarkPrice !== markPrice) {
        set((state) => {
          state.selectedMarket.markPrice = newMarkPrice
        })
      }
    }
  }, [orderbook, fills, markPrice])

  return markPrice
}
