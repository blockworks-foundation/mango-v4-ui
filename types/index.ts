export interface ChartTradeType {
  market: string
  size: number
  quantity: number | any
  price: number | any
  orderId: string
  time: number
  side: string
  takerSide: any
  feeCost: number
  marketAddress: string
}

export interface OrderbookL2 {
  bids: number[][]
  asks: number[][]
}

export type SpotBalances = Record<
  string,
  { inOrders: number; unsettled: number }
>
