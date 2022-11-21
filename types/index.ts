export interface ChartTradeType {
  market: string
  size: number
  quantity: number | any
  price: number | any
  orderId: string
  time: number
  side: string
  feeCost: number
  marketAddress: string
}

export interface Orderbook {
  bids: number[][]
  asks: number[][]
}

export type SpotBalances = Record<
  string,
  { inOrders: number; unsettled: number }
>
