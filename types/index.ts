/* eslint-disable @typescript-eslint/no-explicit-any */
import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import { Modify } from '@blockworks-foundation/mango-v4'
import { Event } from '@project-serum/serum/lib/queue'

export type EmptyObject = { [K in keyof never]?: never }
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
  side: 'buy' | 'sell'
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
  taker_side: 'bid' | 'ask'
  perp_market: string
  market_index: number
  price: number
  quantity: number
  seq_num: number
}

export type SerumEvent = Modify<
  Event,
  {
    price: number
    size: number
    side: string
    feeCost: number
  }
>

export type GenericMarket = Serum3Market | PerpMarket

export type TradeHistoryApiResponseType = {
  trade_type: string
  block_datetime: string
  activity_details: PerpTradeHistory | SpotTradeHistory
}

export type AccountPerformanceData = {
  [date: string]: {
    account_equity: number
    pnl: number
    spot_value: number
    transfer_balance: number
    deposit_interest_cumulative_usd: number
    borrow_interest_cumulative_usd: number
    spot_volume_usd: number
  }
}

export type TotalAccountFundingItem = {
  long_funding: number
  short_funding: number
}

export type HourlyFundingData = [
  string,
  { [key: string]: { long_funding: number; short_funding: number } }
]

export type HourlyFundingStatsData = {
  marketFunding: { long_funding: number; short_funding: number; time: string }[]
  market: string
}

export interface HourlyFundingChartData extends Record<string, any> {
  time: string
}

export interface TotalInterestDataItem {
  borrow_interest: number
  deposit_interest: number
  borrow_interest_usd: number
  deposit_interest_usd: number
  symbol: string
}

export interface PerformanceDataItem {
  account_equity: number
  borrow_interest_cumulative_usd: number
  deposit_interest_cumulative_usd: number
  pnl: number
  spot_value: number
  time: string
  transfer_balance: number
}

export interface DepositWithdrawFeedItem {
  block_datetime: string
  mango_account: string
  quantity: number
  signature: string
  symbol: string
  usd_equivalent: number
  wallet_pk: string
}

export interface LiquidationFeedItem {
  asset_amount: number
  asset_price: number
  asset_symbol: string
  block_datetime: string
  liab_amount: number
  liab_price: number
  liab_symbol: string
  mango_account: string
  mango_group: string
  side: string
  signature: string
}

export interface LiquidationActivity {
  activity_details: LiquidationFeedItem
  block_datetime: string
  activity_type: string
  symbol: string
}

export function isLiquidationFeedItem(
  item: ActivityFeed
): item is LiquidationActivity {
  if (item.activity_type.includes('liquidate')) {
    return true
  }
  return false
}

export interface SwapHistoryItem {
  block_datetime: string
  mango_account: string
  signature: string
  swap_in_amount: number
  swap_in_loan: number
  swap_in_loan_origination_fee: number
  swap_in_price_usd: number
  swap_in_symbol: string
  swap_out_amount: number
  loan: number
  loan_origination_fee: number
  swap_out_price_usd: number
  swap_out_symbol: string
}

export interface NFT {
  address: string
  image: string
}

export interface PerpStatsItem {
  date_hour: string
  fees_accrued: number
  funding_rate_hourly: number
  instantaneous_funding_rate: number
  mango_group: string
  market_index: number
  open_interest: number
  perp_market: string
  price: number
  stable_price: number
}

export type ActivityFeed = {
  activity_type: string
  block_datetime: string
  symbol: string
  activity_details:
    | DepositWithdrawFeedItem
    | LiquidationFeedItem
    | SwapHistoryItem
    | PerpTradeHistory
    | SpotTradeHistory
}

export interface ProfileDetails {
  profile_image_url?: string
  profile_name: string
  trader_category: string
  wallet_pk: string
}

export interface TourSettings {
  account_tour_seen: boolean
  swap_tour_seen: boolean
  trade_tour_seen: boolean
  wallet_pk: string
}

export interface TokenStatsItem {
  borrow_apr: number
  borrow_rate: number
  collected_fees: number
  date_hour: string
  deposit_apr: number
  deposit_rate: number
  mango_group: string
  price: number
  symbol: string
  token_index: number
  total_borrows: number
  total_deposits: number
}

export interface TradeForm {
  side: 'buy' | 'sell'
  price: string | undefined
  baseSize: string
  quoteSize: string
  tradeType: 'Market' | 'Limit'
  postOnly: boolean
  ioc: boolean
  reduceOnly: boolean
}

export interface MangoError extends Error {
  txid: string
}

export function isMangoError(error: unknown): error is MangoError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'txid' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}
