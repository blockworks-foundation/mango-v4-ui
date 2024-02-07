/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MangoAccount,
  ParsedFillEvent,
  PerpMarket,
  PerpPosition,
  Serum3Market,
} from '@blockworks-foundation/mango-v4'
import { Modify } from '@blockworks-foundation/mango-v4'
import { JsonMetadata } from '@metaplex-foundation/js'
import { Event } from '@project-serum/serum/lib/queue'
import { PublicKey } from '@solana/web3.js'
import { formatTradeHistory } from 'hooks/useTradeHistory'
import { OrderTypes, TriggerOrderTypes } from 'utils/tradeForm'

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

export const isApiSpotTradeHistory = (
  t: SpotTradeHistory | PerpTradeHistory,
): t is SpotTradeHistory => {
  if ('open_orders' in t) return true
  else return false
}

export type PerpFillEvent = ParsedFillEvent

export type CombinedTradeHistory = ReturnType<typeof formatTradeHistory>

export type CombinedTradeHistoryTypes =
  | SpotTradeHistory
  | PerpTradeHistory
  | PerpFillEvent
  | SerumEvent

export const isSerumFillEvent = (
  t: CombinedTradeHistoryTypes,
): t is SerumEvent => {
  if ('eventFlags' in t) return true
  else return false
}

export const isPerpFillEvent = (
  t: CombinedTradeHistoryTypes,
): t is PerpFillEvent => {
  if ('takerSide' in t) return true
  else return false
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
  { [key: string]: { long_funding: number; short_funding: number } },
]

export type HourlyFundingStatsData = {
  marketFunding: { long_funding: number; short_funding: number; time: string }[]
  market: string
}

export interface HourlyFundingChartData extends Record<string, any> {
  time: string
}

export type AccountVolumeTotalData = [string, { volume_usd: number }]

export type HourlyAccountVolumeData = {
  [market: string]: {
    [timestamp: string]: {
      volume_usd: number
    }
  }
}

export type FormattedHourlyAccountVolumeData = {
  time: string
  total_volume_usd: number
  markets: Record<string, number>
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

interface PerpTradeActivityFeedItem {
  block_datetime: string
  maker: string
  maker_fee: number
  maker_order_id: string | null
  market_index: number
  perp_market: string
  perp_market_name: string
  price: number
  quantity: number
  seq_num: number
  signature: number
  slot: number
  taker: string
  taker_client_order_id: string | null
  taker_fee: number
  taker_order_id: string | null
  taker_side: string
}

interface SpotTradeActivityFeedItem {
  base_symbol: string
  bid: boolean
  block_datetime: string
  client_order_id: string
  fee_cost: number
  fee_tier: number
  instruction_num: number
  maker: boolean
  mango_account: string
  market: string
  open_orders: string
  open_orders_owner: string
  order_id: string
  price: number
  quote_symbol: string
  referrer_rebate: null
  side: 'buy' | 'sell'
  signature: string
  size: number
}

export interface SpotLiquidationFeedItem {
  asset_amount: number
  asset_price: number
  asset_symbol: string
  block_datetime: string
  counterparty: string
  liab_amount: number
  liab_price: number
  liab_symbol: string
  mango_account: string
  mango_group: string
  side: 'liqor' | 'liqee'
  signature: string
}

export interface PerpLiquidationFeedItem {
  base_transfer: -0.5
  block_datetime: string
  counterparty: string
  mango_account: string
  mango_group: string
  perp_market_name: string
  pnl_settle_limit_transfer: number
  pnl_transfer: number
  price: number
  quote_transfer: number
  side: 'liqor' | 'liqee'
  signature: string
}

export type SpotOrPerpLiquidationItem =
  | SpotLiquidationFeedItem
  | PerpLiquidationFeedItem

export interface LiquidationActivity {
  activity_details: SpotOrPerpLiquidationItem
  block_datetime: string
  activity_type: string
  symbol: string
}

export interface PerpTradeActivity {
  activity_details: PerpTradeActivityFeedItem
  block_datetime: string
  activity_type: string
  symbol: string
}

export interface SpotTradeActivity {
  activity_details: SpotTradeActivityFeedItem
  block_datetime: string
  activity_type: string
  symbol: string
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

export interface SwapActivity {
  activity_details: SwapHistoryItem
  block_datetime: string
  activity_type: string
}

export interface SettleFundsActivity {
  activity_details: SettleFundsItem
  block_datetime: string
  activity_type: string
}

export interface SettleFundsItem {
  block_datetime: string
  mango_account: string
  signature: string
  symbol: string
  price: number
  fee: number
}

interface DepositWithdrawActivity {
  activity_details: DepositWithdrawFeedItem
  block_datetime: string
  activity_type: string
}

export function isLiquidationActivityFeedItem(
  item: ActivityFeed,
): item is LiquidationActivity {
  if (item.activity_type.includes('liquidate')) {
    return true
  }
  return false
}

export function isPerpTradeActivityFeedItem(
  item: ActivityFeed,
): item is PerpTradeActivity {
  if (item.activity_type === 'perp_trade') {
    return true
  }
  return false
}

export function isSpotTradeActivityFeedItem(
  item: ActivityFeed,
): item is SpotTradeActivity {
  if (item.activity_type === 'openbook_trade') {
    return true
  }
  return false
}

export function isSwapActivityFeedItem(
  item: ActivityFeed,
): item is SwapActivity {
  if (item.activity_type === 'swap') {
    return true
  }
  return false
}

export function isDepositWithdrawActivityFeedItem(
  item: ActivityFeed,
): item is DepositWithdrawActivity {
  if (item.activity_type === 'deposit' || item.activity_type === 'withdraw') {
    return true
  }
  return false
}

export function isPerpLiquidation(
  activityDetails: SpotOrPerpLiquidationItem,
): activityDetails is PerpLiquidationFeedItem {
  if ((activityDetails as PerpLiquidationFeedItem).base_transfer) {
    return true
  }
  return false
}

export interface NFT {
  address: string
  collectionAddress?: string
  image: string
  name: string
  mint: string
  tokenAccount: string
  json: JsonMetadata | null
}

export interface PerpStatsItem {
  cumulative_base_volume: number
  cumulative_quote_volume: number
  date_hour: string
  fees_accrued: number
  fees_settled: number
  funding_rate_hourly: number
  instantaneous_funding_rate: number
  mango_group: string
  market_index: number
  open_interest: number
  perp_market: string
  price: number
  stable_price: number
  total_fees: number
}

export type PositionStat = {
  account?: MangoAccount
  mangoAccount: PublicKey
  perpPosition: PerpPosition
}

export type GroupedDataItem = PerpStatsItem & Record<string, any>

export type ActivityFeed = {
  activity_type: string
  block_datetime: string
  symbol?: string
  activity_details:
    | DepositWithdrawFeedItem
    | SpotLiquidationFeedItem
    | PerpLiquidationFeedItem
    | SwapHistoryItem
    | SettleFundsItem
    | PerpTradeActivityFeedItem
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

export interface MangoTokenStatsItem {
  date: string
  borrowValue: number
  depositValue: number
  feesCollected: number
}

export interface TradeForm {
  side: 'buy' | 'sell'
  price: string | undefined
  baseSize: string
  quoteSize: string
  tradeType: OrderTypes | TriggerOrderTypes
  triggerPrice?: string
  postOnly: boolean
  ioc: boolean
  reduceOnly: boolean
}

export interface ThemeData {
  buttonStyle: 'flat' | 'raised'
  fonts: {
    body: any
    display: any
    mono: any
    rewards: any
  }
  logoPath: string
  platformName: string
  rainAnimationImagePath: string
  sideImagePath: string
  sideTilePath: string
  sideTilePathExpanded: string
  topTilePath: string
  tvChartTheme: 'Light' | 'Dark'
  tvImagePath: string
  useGradientBg: boolean
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

export interface BirdeyePriceResponse {
  address: string
  unixTime: number
  value: number
}

export type MarketData = { [key: string]: MarketsDataItem[] }

export type MarketsDataItem = {
  base_volume_1h: number
  base_volume_24h: number
  change_1h: number
  change_7d: number
  change_24h: number
  change_30d: number
  last_price: number
  price_1h: number
  price_24h: number
  price_history: { price: number; time: string }[] | undefined
  quote_volume_1h: number
  quote_volume_24h: number
  notionalQuoteVolume: number | undefined
}

export type cumOrderbookSide = {
  price: number
  size: number
  averagePrice: number
  cumulativeSize: number
  cumulativeValue: number
  sizePercent: number
  maxSizePercent: number
  cumulativeSizePercent: number
  isUsersOrder: boolean
}

export type OrderbookData = {
  bids: cumOrderbookSide[]
  asks: cumOrderbookSide[]
  spread: number
  spreadPercentage: number
}

export type OrderbookTooltip = {
  averagePrice: number
  cumulativeSize: number
  cumulativeValue: number
  side: 'buy' | 'sell'
}

export interface HealthContribution {
  asset: string
  contribution: number
  contributionDetails?: ContributionDetails
  hasPerp?: boolean
  isAsset: boolean
}

export interface PerpMarketContribution {
  market: string
  contributionUi: number
}

export interface ContributionDetails {
  perpMarketContributions: PerpMarketContribution[]
  spotUi: number
}

export interface FilledOrdersApiResponseType {
  fills: FilledOrder[]
}

export interface FilledOrder {
  order_id: string
  order_type: 'spot' | 'perp'
  quantity: number
}

export type SwapTypes = 'swap' | 'trade:trigger-order'
