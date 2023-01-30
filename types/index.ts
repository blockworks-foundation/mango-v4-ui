import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import { BN } from '@project-serum/anchor'

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
  timestamp: BN
}

export interface OrderbookL2 {
  bids: number[][]
  asks: number[][]
}

export type SpotBalances = Record<
  string,
  { inOrders: number; unsettled: number }
>

export interface SpotTradeHistory {
  signature: string
  block_datetime: string
  market: string
  open_orders: string
  mango_account: string
  bid: boolean
  maker: boolean
  referrer_rebate: any
  order_id: string
  client_order_id: string
  fee_tier: number
  instruction_num: number
  size: number
  price: number
  side: string
  fee_cost: number
  open_orders_owner: string
  base_symbol: string
  quote_symbol: string
}

export interface PerpTradeHistory {
  signature: string
  slot: number
  block_datetime: string
  maker: string
  maker_order_id: string
  maker_fee: number
  taker: string
  taker_order_id: string
  taker_client_order_id: string
  taker_fee: number
  taker_side: string
  perp_market: string
  market_index: number
  price: number
  quantity: number
  seq_num: number
}

export type GenericMarket = Serum3Market | PerpMarket
