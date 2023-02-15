import dayjs from 'dayjs'
import produce from 'immer'
import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { AnchorProvider, BN, Wallet, web3 } from '@project-serum/anchor'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { OpenOrders, Order } from '@project-serum/serum/lib/market'
import { Orderbook } from '@project-serum/serum'
import { Wallet as WalletAdapter } from '@solana/wallet-adapter-react'
import {
  MangoClient,
  Group,
  MangoAccount,
  Serum3Market,
  MANGO_V4_ID,
  Bank,
  PerpOrder,
  PerpPosition,
  BookSide,
  FillEvent,
} from '@blockworks-foundation/mango-v4'

import EmptyWallet from '../utils/wallet'
import { Notification, notify } from '../utils/notifications'
import {
  fetchNftsFromHolaplexIndexer,
  getTokenAccountsByOwnerWithWrappedSol,
  TokenAccount,
} from '../utils/tokens'
import { Token } from '../types/jupiter'
import {
  CONNECTION_COMMITMENT,
  DEFAULT_MARKET_NAME,
  INPUT_TOKEN_DEFAULT,
  LAST_ACCOUNT_KEY,
  MANGO_DATA_API_URL,
  OUTPUT_TOKEN_DEFAULT,
  PAGINATION_PAGE_LENGTH,
  PRIORITY_FEE_KEY,
  RPC_PROVIDER_KEY,
} from '../utils/constants'
import {
  OrderbookL2,
  PerpTradeHistory,
  SpotBalances,
  SpotTradeHistory,
} from 'types'
import spotBalancesUpdater from './spotBalancesUpdater'
import { PerpMarket } from '@blockworks-foundation/mango-v4/'
import perpPositionsUpdater from './perpPositionsUpdater'
import { DEFAULT_PRIORITY_FEE } from '@components/settings/RpcSettings'
import { IOrderLineAdapter } from '@public/charting_library/charting_library'

const GROUP = new PublicKey('78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX')

const ENDPOINTS = [
  {
    name: 'mainnet-beta',
    url:
      process.env.NEXT_PUBLIC_ENDPOINT ||
      'https://mango.rpcpool.com/0f9acc0d45173b51bf7d7e09c1e5',
    websocket:
      process.env.NEXT_PUBLIC_ENDPOINT ||
      'https://mango.rpcpool.com/0f9acc0d45173b51bf7d7e09c1e5',
    custom: false,
  },
  {
    name: 'devnet',
    url: 'https://mango.devnet.rpcpool.com',
    websocket: 'https://mango.devnet.rpcpool.com',
    custom: false,
  },
]

const options = AnchorProvider.defaultOptions()
export const CLUSTER: 'mainnet-beta' | 'devnet' = 'mainnet-beta'
const ENDPOINT = ENDPOINTS.find((e) => e.name === CLUSTER) || ENDPOINTS[0]
const emptyWallet = new EmptyWallet(Keypair.generate())

const initMangoClient = (
  provider: AnchorProvider,
  opts = { prioritizationFee: DEFAULT_PRIORITY_FEE.value }
): MangoClient => {
  return MangoClient.connect(provider, CLUSTER, MANGO_V4_ID[CLUSTER], {
    prioritizationFee: opts.prioritizationFee,
    idsSource: 'get-program-accounts',
    postSendTxCallback: ({ txid }: { txid: string }) => {
      notify({
        title: 'Transaction sent',
        description: 'Waiting for confirmation',
        type: 'confirm',
        txid: txid,
      })
    },
  })
}

let mangoGroupRetryAttempt = 0

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
  activity_details: {
    block_datetime: string
    mango_account: string
    quantity: number
    signature: string
    symbol: string
    usd_equivalent: number
    wallet_pk: string
  }
  activity_type: string
  block_datetime: string
  symbol: string
}

export interface LiquidationFeedItem {
  activity_details: {
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
  activity_type: string
  block_datetime: string
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

interface NFT {
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

interface ProfileDetails {
  profile_image_url?: string
  profile_name: string
  trader_category: string
  wallet_pk: string
}

interface TourSettings {
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

// const defaultUserSettings = {
//   account_tour_seen: false,
//   default_language: 'English',
//   default_market: 'SOL-Perp',
//   orderbook_animation: false,
//   rpc_endpoint: 'Triton (RPC Pool)',
//   rpc_node_url: null,
//   spot_margin: false,
//   swap_tour_seen: false,
//   theme: 'Mango',
//   trade_tour_seen: false,
//   wallet_pk: '',
// }

interface TradeForm {
  side: 'buy' | 'sell'
  price: string | undefined
  baseSize: string
  quoteSize: string
  tradeType: 'Market' | 'Limit'
  postOnly: boolean
  ioc: boolean
  reduceOnly: boolean
}

export const DEFAULT_TRADE_FORM: TradeForm = {
  side: 'buy',
  price: undefined,
  baseSize: '',
  quoteSize: '',
  tradeType: 'Limit',
  postOnly: false,
  ioc: false,
  reduceOnly: false,
}

export type MangoStore = {
  activityFeed: {
    feed: Array<DepositWithdrawFeedItem | LiquidationFeedItem>
    loading: boolean
    queryParams: string
  }
  connected: boolean
  connection: Connection
  group: Group | undefined
  groupLoaded: boolean
  client: MangoClient
  mangoAccount: {
    current: MangoAccount | undefined
    initialLoad: boolean
    lastSlot: number
    openOrderAccounts: OpenOrders[]
    openOrders: Record<string, Order[] | PerpOrder[]>
    perpPositions: PerpPosition[]
    spotBalances: SpotBalances
    interestTotals: { data: TotalInterestDataItem[]; loading: boolean }
    performance: {
      data: PerformanceDataItem[]
      loading: boolean
    }
    swapHistory: {
      data: SwapHistoryItem[]
      loading: boolean
    }
    tradeHistory: {
      data: Array<SpotTradeHistory | PerpTradeHistory>
      loading: boolean
    }
  }
  mangoAccounts: MangoAccount[]
  markets: Serum3Market[] | undefined
  notificationIdCounter: number
  notifications: Array<Notification>
  perpMarkets: PerpMarket[]
  perpStats: {
    loading: boolean
    data: PerpStatsItem[] | null
  }
  profile: {
    details: ProfileDetails | null
    loadDetails: boolean
  }
  selectedMarket: {
    name: string
    current: Serum3Market | PerpMarket | undefined
    fills: (FillEvent | any)[]
    bidsAccount: BookSide | Orderbook | undefined
    asksAccount: BookSide | Orderbook | undefined
    orderbook: OrderbookL2
    markPrice: number
  }
  serumMarkets: Serum3Market[]
  serumOrders: Order[] | undefined
  settings: {
    loading: boolean
    tours: TourSettings
    uiLocked: boolean
  }
  successAnimation: {
    swap: boolean
    trade: boolean
  }
  swap: {
    inputBank: Bank | undefined
    outputBank: Bank | undefined
    inputTokenInfo: Token | undefined
    outputTokenInfo: Token | undefined
    margin: boolean
    slippage: number
    swapMode: 'ExactIn' | 'ExactOut'
    amountIn: string
    amountOut: string
  }
  set: (x: (x: MangoStore) => void) => void
  tokenStats: {
    initialLoad: boolean
    loading: boolean
    data: TokenStatsItem[] | null
  }
  tradeForm: TradeForm
  tradingView: {
    orderLines: Map<string | BN, IOrderLineAdapter>
  }
  wallet: {
    tokens: TokenAccount[]
    nfts: {
      data: NFT[] | []
      loading: boolean
    }
  }
  actions: {
    fetchAccountInterestTotals: (mangoAccountPk: string) => Promise<void>
    fetchActivityFeed: (
      mangoAccountPk: string,
      offset?: number,
      params?: string
    ) => Promise<void>
    fetchAccountPerformance: (
      mangoAccountPk: string,
      range: number
    ) => Promise<void>
    fetchGroup: () => Promise<void>
    reloadMangoAccount: () => Promise<void>
    fetchMangoAccounts: (ownerPk: PublicKey) => Promise<void>
    fetchNfts: (connection: Connection, walletPk: PublicKey) => void
    fetchOpenOrders: (ma?: MangoAccount) => Promise<void>
    fetchPerpStats: () => void
    fetchProfileDetails: (walletPk: string) => void
    fetchSwapHistory: (
      mangoAccountPk: string,
      timeout?: number,
      offset?: number
    ) => Promise<void>
    fetchTokenStats: () => void
    fetchTourSettings: (walletPk: string) => void
    fetchTradeHistory: (offset?: number) => Promise<void>
    fetchWalletTokens: (walletPk: PublicKey) => Promise<void>
    connectMangoClientWithWallet: (wallet: WalletAdapter) => Promise<void>
    loadMarketFills: () => Promise<void>
    updateConnection: (url: string) => void
  }
}

const mangoStore = create<MangoStore>()(
  subscribeWithSelector((_set, get) => {
    let rpcUrl = ENDPOINT.url

    if (typeof window !== 'undefined' && CLUSTER === 'mainnet-beta') {
      const urlFromLocalStorage = localStorage.getItem(RPC_PROVIDER_KEY)
      rpcUrl = urlFromLocalStorage
        ? JSON.parse(urlFromLocalStorage).value
        : ENDPOINT.url
    }

    let connection: Connection
    try {
      connection = new web3.Connection(rpcUrl, CONNECTION_COMMITMENT)
    } catch {
      connection = new web3.Connection(ENDPOINT.url, CONNECTION_COMMITMENT)
    }
    const provider = new AnchorProvider(connection, emptyWallet, options)
    provider.opts.skipPreflight = true
    const client = initMangoClient(provider)

    return {
      activityFeed: {
        feed: [],
        loading: true,
        queryParams: '',
      },
      connected: false,
      connection,
      group: undefined,
      groupLoaded: false,
      client,
      mangoAccount: {
        current: undefined,
        initialLoad: true,
        lastSlot: 0,
        openOrderAccounts: [],
        openOrders: {},
        perpPositions: [],
        spotBalances: {},
        interestTotals: { data: [], loading: false },
        performance: { data: [], loading: true },
        swapHistory: { data: [], loading: true },
        tradeHistory: { data: [], loading: true },
      },
      mangoAccounts: [],
      markets: undefined,
      notificationIdCounter: 0,
      notifications: [],
      perpMarkets: [],
      perpStats: {
        loading: false,
        data: [],
      },
      profile: {
        loadDetails: false,
        details: { profile_name: '', trader_category: '', wallet_pk: '' },
      },
      selectedMarket: {
        name: DEFAULT_MARKET_NAME,
        current: undefined,
        fills: [],
        bidsAccount: undefined,
        asksAccount: undefined,
        orderbook: {
          bids: [],
          asks: [],
        },
        markPrice: 0,
      },
      serumMarkets: [],
      serumOrders: undefined,
      set: (fn) => _set(produce(fn)),
      settings: {
        loading: false,
        tours: {
          account_tour_seen: true,
          swap_tour_seen: true,
          trade_tour_seen: true,
          wallet_pk: '',
        },
        uiLocked: true,
      },
      successAnimation: {
        swap: false,
        trade: false,
      },
      swap: {
        inputBank: undefined,
        outputBank: undefined,
        inputTokenInfo: undefined,
        outputTokenInfo: undefined,
        margin: true,
        slippage: 0.5,
        swapMode: 'ExactIn',
        amountIn: '',
        amountOut: '',
      },
      tokenStats: {
        initialLoad: false,
        loading: false,
        data: [],
      },
      tradeForm: DEFAULT_TRADE_FORM,
      tradingView: {
        orderLines: new Map(),
      },
      wallet: {
        tokens: [],
        nfts: {
          data: [],
          loading: false,
        },
      },
      actions: {
        fetchAccountInterestTotals: async (mangoAccountPk: string) => {
          const set = get().set
          set((state) => {
            state.mangoAccount.interestTotals.loading = true
          })
          try {
            const response = await fetch(
              `${MANGO_DATA_API_URL}/stats/interest-account-total?mango-account=${mangoAccountPk}`
            )
            const parsedResponse = await response.json()
            const entries: any = Object.entries(parsedResponse).sort((a, b) =>
              b[0].localeCompare(a[0])
            )

            const stats = entries
              .map(([key, value]: Array<{ key: string; value: number }>) => {
                return { ...value, symbol: key }
              })
              .filter((x: string) => x)

            set((state) => {
              state.mangoAccount.interestTotals.data = stats
              state.mangoAccount.interestTotals.loading = false
            })
          } catch {
            set((state) => {
              state.mangoAccount.interestTotals.loading = false
            })
            console.error({
              title: 'Failed to load account interest totals',
              type: 'error',
            })
          }
        },
        fetchAccountPerformance: async (
          mangoAccountPk: string,
          range: number
        ) => {
          const set = get().set
          try {
            const response = await fetch(
              `${MANGO_DATA_API_URL}/stats/performance_account?mango-account=${mangoAccountPk}&start-date=${dayjs()
                .subtract(range, 'day')
                .format('YYYY-MM-DD')}`
            )
            const parsedResponse = await response.json()
            const entries: any = Object.entries(parsedResponse).sort((a, b) =>
              b[0].localeCompare(a[0])
            )

            const stats = entries
              .map(([key, value]: Array<{ key: string; value: number }>) => {
                return { ...value, time: key }
              })
              .filter((x: string) => x)

            set((state) => {
              state.mangoAccount.performance.data = stats.reverse()
            })
          } catch (e) {
            console.error('Failed to load account performance data', e)
          } finally {
            set((state) => {
              state.mangoAccount.performance.loading = false
            })
          }
        },
        fetchActivityFeed: async (
          mangoAccountPk: string,
          offset = 0,
          params = ''
        ) => {
          const set = get().set
          const loadedFeed = mangoStore.getState().activityFeed.feed
          const connectedMangoAccountPk = mangoStore
            .getState()
            .mangoAccount.current?.publicKey.toString()

          try {
            const response = await fetch(
              `${MANGO_DATA_API_URL}/stats/activity-feed?mango-account=${mangoAccountPk}&offset=${offset}&limit=${PAGINATION_PAGE_LENGTH}${
                params ? params : ''
              }`
            )
            const parsedResponse = await response.json()
            const entries: any = Object.entries(parsedResponse).sort((a, b) =>
              b[0].localeCompare(a[0])
            )

            const latestFeed = entries
              .map(([key, value]: Array<{ key: string; value: number }>) => {
                return { ...value, symbol: key }
              })
              .filter((x: string) => x)
              .sort(
                (
                  a: DepositWithdrawFeedItem | LiquidationFeedItem,
                  b: DepositWithdrawFeedItem | LiquidationFeedItem
                ) =>
                  dayjs(b.block_datetime).unix() -
                  dayjs(a.block_datetime).unix()
              )

            // only add to current feed if data request is offset and the mango account hasn't changed
            const combinedFeed =
              offset !== 0 &&
              connectedMangoAccountPk ===
                loadedFeed[0]?.activity_details?.mango_account
                ? loadedFeed.concat(latestFeed)
                : latestFeed

            set((state) => {
              state.activityFeed.feed = combinedFeed
            })
          } catch (e) {
            console.error('Failed to fetch account activity feed', e)
          } finally {
            set((state) => {
              state.activityFeed.loading = false
            })
          }
        },
        fetchGroup: async () => {
          try {
            const set = get().set
            const client = get().client
            const group = await client.getGroup(GROUP)
            const selectedMarketName = get().selectedMarket.name

            const inputBank =
              group?.banksMapByName.get(INPUT_TOKEN_DEFAULT)?.[0]
            const outputBank =
              group?.banksMapByName.get(OUTPUT_TOKEN_DEFAULT)?.[0]
            const serumMarkets = Array.from(
              group.serum3MarketsMapByExternal.values()
            )
            const perpMarkets = Array.from(
              group.perpMarketsMapByName.values()
            ).filter(
              (p) =>
                p.publicKey.toString() !==
                '9Y8paZ5wUpzLFfQuHz8j2RtPrKsDtHx9sbgFmWb5abCw'
            )

            const selectedMarket =
              serumMarkets.find((m) => m.name === selectedMarketName) ||
              perpMarkets.find((m) => m.name === selectedMarketName) ||
              serumMarkets[0]

            set((state) => {
              state.group = group
              state.groupLoaded = true
              state.serumMarkets = serumMarkets
              state.perpMarkets = perpMarkets
              state.selectedMarket.current = selectedMarket
              if (!state.swap.inputBank && !state.swap.outputBank) {
                state.swap.inputBank = inputBank
                state.swap.outputBank = outputBank
              } else {
                state.swap.inputBank = group.getFirstBankByMint(
                  state.swap.inputBank!.mint
                )
                state.swap.outputBank = group.getFirstBankByMint(
                  state.swap.outputBank!.mint
                )
              }
            })
            mangoGroupRetryAttempt = 0
          } catch (e) {
            if (mangoGroupRetryAttempt < 2) {
              // get().actions.fetchGroup()
              mangoGroupRetryAttempt++
            } else {
              notify({ type: 'info', title: 'Unable to refresh data' })
              console.error('Error fetching group', e)
            }
          }
        },
        reloadMangoAccount: async () => {
          const set = get().set
          const actions = get().actions
          try {
            const group = get().group
            const client = get().client
            const mangoAccount = get().mangoAccount.current
            const lastSlot = get().mangoAccount.lastSlot
            if (!group) throw new Error('Group not loaded')
            if (!mangoAccount)
              throw new Error('No mango account exists for reload')

            const { value: reloadedMangoAccount, slot } =
              await mangoAccount.reloadWithSlot(client)
            if (slot > lastSlot) {
              const ma = get().mangoAccounts.find((ma) =>
                ma.publicKey.equals(reloadedMangoAccount.publicKey)
              )
              if (ma) {
                Object.assign(ma, reloadedMangoAccount)
              }
              set((state) => {
                state.mangoAccount.current = reloadedMangoAccount
                state.mangoAccount.lastSlot = slot
              })
            }
          } catch (e) {
            console.error('Error reloading mango acct', e)
            actions.reloadMangoAccount()
          } finally {
            set((state) => {
              state.mangoAccount.initialLoad = false
            })
          }
        },
        fetchMangoAccounts: async (ownerPk: PublicKey) => {
          const set = get().set
          const actions = get().actions
          try {
            const group = get().group
            const client = get().client
            const selectedMangoAccount = get().mangoAccount.current
            if (!group) throw new Error('Group not loaded')
            if (!client) throw new Error('Client not loaded')

            const mangoAccounts = await client.getMangoAccountsForOwner(
              group,
              ownerPk
            )
            const selectedAccountIsNotInAccountsList = mangoAccounts.find(
              (x) =>
                x.publicKey.toBase58() ===
                selectedMangoAccount?.publicKey.toBase58()
            )
            if (!mangoAccounts?.length) {
              set((state) => {
                state.mangoAccounts = []
                state.mangoAccount.current = undefined
              })
              return
            }

            let newSelectedMangoAccount = selectedMangoAccount
            if (!selectedMangoAccount || !selectedAccountIsNotInAccountsList) {
              const lastAccount = localStorage.getItem(LAST_ACCOUNT_KEY)
              newSelectedMangoAccount = mangoAccounts[0]

              if (typeof lastAccount === 'string') {
                const lastViewedAccount = mangoAccounts.find(
                  (m) => m.publicKey.toString() === lastAccount
                )
                newSelectedMangoAccount = lastViewedAccount || mangoAccounts[0]
              }
            }

            if (newSelectedMangoAccount) {
              await newSelectedMangoAccount.reloadSerum3OpenOrders(client)
              set((state) => {
                state.mangoAccount.current = newSelectedMangoAccount
                state.mangoAccount.initialLoad = false
              })
              actions.fetchOpenOrders(newSelectedMangoAccount)
            }

            await Promise.all(
              mangoAccounts.map((ma) => ma.reloadSerum3OpenOrders(client))
            )

            set((state) => {
              state.mangoAccounts = mangoAccounts
            })
          } catch (e) {
            console.error('Error fetching mango accts', e)
          } finally {
            set((state) => {
              state.mangoAccount.initialLoad = false
            })
          }
        },
        fetchNfts: async (connection: Connection, ownerPk: PublicKey) => {
          const set = get().set
          set((state) => {
            state.wallet.nfts.loading = true
          })
          try {
            const data = await fetchNftsFromHolaplexIndexer(ownerPk)
            set((state) => {
              state.wallet.nfts.data = data.nfts
              state.wallet.nfts.loading = false
            })
          } catch (error) {
            notify({
              type: 'error',
              title: 'Unable to fetch nfts',
            })
          }
          return []
        },
        fetchOpenOrders: async (providedMangoAccount) => {
          const set = get().set
          const client = get().client
          const group = get().group
          if (!providedMangoAccount) {
            await get().actions.reloadMangoAccount()
          }
          const mangoAccount =
            providedMangoAccount || get().mangoAccount.current

          if (!mangoAccount || !group) return

          try {
            const openOrders: Record<string, Order[] | PerpOrder[]> = {}
            let serumOpenOrderAccounts: OpenOrders[] = []

            for (const serum3Orders of mangoAccount.serum3Active()) {
              if (serum3Orders.marketIndex === 65535) continue
              const market = group.getSerum3MarketByMarketIndex(
                serum3Orders.marketIndex
              )
              if (market) {
                const orders = await mangoAccount.loadSerum3OpenOrdersForMarket(
                  client,
                  group,
                  market.serumMarketExternal
                )
                openOrders[market.serumMarketExternal.toString()] = orders
              }
            }
            if (
              mangoAccount.serum3Active().length &&
              Object.keys(openOrders).length
            ) {
              serumOpenOrderAccounts = Array.from(
                mangoAccount.serum3OosMapByMarketIndex.values()
              )
              await mangoAccount.loadSerum3OpenOrdersAccounts(client)
            }

            for (const perpOrder of mangoAccount.perpOrdersActive()) {
              const market = group.getPerpMarketByMarketIndex(
                perpOrder.orderMarket
              )
              const orders = await mangoAccount.loadPerpOpenOrdersForMarket(
                client,
                group,
                perpOrder.orderMarket
              )
              openOrders[market.publicKey.toString()] = orders
            }

            set((s) => {
              s.mangoAccount.openOrders = openOrders
              s.mangoAccount.openOrderAccounts = serumOpenOrderAccounts
            })
          } catch (e) {
            console.error('Failed loading open orders ', e)
          }
        },
        fetchPerpStats: async () => {
          const set = get().set
          const group = get().group
          const stats = get().perpStats.data
          if ((stats && stats.length) || !group) return
          set((state) => {
            state.perpStats.loading = true
          })
          try {
            const response = await fetch(
              `${MANGO_DATA_API_URL}/perp-historical-stats?mango-group=${group?.publicKey.toString()}`
            )
            const data = await response.json()

            set((state) => {
              state.perpStats.data = data
              state.perpStats.loading = false
            })
          } catch {
            set((state) => {
              state.perpStats.loading = false
            })
            notify({
              title: 'Failed to fetch token stats data',
              type: 'error',
            })
          }
        },
        fetchSwapHistory: async (
          mangoAccountPk: string,
          timeout = 0,
          offset = 0
        ) => {
          const set = get().set
          const loadedSwapHistory =
            mangoStore.getState().mangoAccount.swapHistory.data

          setTimeout(async () => {
            try {
              const history = await fetch(
                `${MANGO_DATA_API_URL}/stats/swap-history?mango-account=${mangoAccountPk}&offset=${offset}&limit=${PAGINATION_PAGE_LENGTH}`
              )
              const parsedHistory = await history.json()
              const sortedHistory =
                parsedHistory && parsedHistory.length
                  ? parsedHistory.sort(
                      (a: SwapHistoryItem, b: SwapHistoryItem) =>
                        dayjs(b.block_datetime).unix() -
                        dayjs(a.block_datetime).unix()
                    )
                  : []

              const combinedHistory =
                offset !== 0
                  ? loadedSwapHistory.concat(sortedHistory)
                  : sortedHistory

              set((state) => {
                state.mangoAccount.swapHistory.data = combinedHistory
              })
            } catch (e) {
              console.error('Unable to fetch swap history', e)
            } finally {
              set((state) => {
                state.mangoAccount.swapHistory.loading = false
              })
            }
          }, timeout)
        },
        fetchTokenStats: async () => {
          const set = get().set
          const group = get().group
          if (!group) return
          set((state) => {
            state.tokenStats.loading = true
          })
          try {
            const response = await fetch(
              `${MANGO_DATA_API_URL}/token-historical-stats?mango-group=${group?.publicKey.toString()}`
            )
            const data = await response.json()

            set((state) => {
              state.tokenStats.data = data
              state.tokenStats.initialLoad = true
              state.tokenStats.loading = false
            })
          } catch {
            set((state) => {
              state.tokenStats.loading = false
            })
            notify({
              title: 'Failed to fetch token stats data',
              type: 'error',
            })
          }
        },
        fetchWalletTokens: async (walletPk: PublicKey) => {
          const set = get().set
          const connection = get().connection

          if (walletPk) {
            const token = await getTokenAccountsByOwnerWithWrappedSol(
              connection,
              walletPk
            )

            set((state) => {
              state.wallet.tokens = token
            })
          } else {
            set((state) => {
              state.wallet.tokens = []
            })
          }
        },
        connectMangoClientWithWallet: async (wallet: WalletAdapter) => {
          const set = get().set
          try {
            const provider = new AnchorProvider(
              connection,
              wallet.adapter as unknown as Wallet,
              options
            )
            provider.opts.skipPreflight = true
            const prioritizationFee = Number(
              localStorage.getItem(PRIORITY_FEE_KEY) ??
                DEFAULT_PRIORITY_FEE.value
            )
            const client = initMangoClient(provider, { prioritizationFee })

            set((s) => {
              s.client = client
            })
          } catch (e: any) {
            if (e.name.includes('WalletLoadError')) {
              notify({
                title: `${wallet.adapter.name} Error`,
                type: 'error',
                description: `Please install ${wallet.adapter.name} and then reload this page.`,
              })
            }
          }
        },
        async fetchProfileDetails(walletPk: string) {
          const set = get().set
          set((state) => {
            state.profile.loadDetails = true
          })
          try {
            const response = await fetch(
              `${MANGO_DATA_API_URL}/user-data/profile-details?wallet-pk=${walletPk}`
            )
            const data = await response.json()
            set((state) => {
              state.profile.details = data
              state.profile.loadDetails = false
            })
          } catch (e) {
            notify({ type: 'error', title: 'Failed to load profile details' })
            console.error(e)
            set((state) => {
              state.profile.loadDetails = false
            })
          }
        },
        async fetchTourSettings(walletPk: string) {
          const set = get().set
          set((state) => {
            state.settings.loading = true
          })
          try {
            const response = await fetch(
              `${MANGO_DATA_API_URL}/user-data/settings-unsigned?wallet-pk=${walletPk}`
            )
            const data = await response.json()
            set((state) => {
              state.settings.tours = data
              state.settings.loading = false
            })
          } catch (e) {
            notify({ type: 'error', title: 'Failed to load profile details' })
            console.error(e)
            set((state) => {
              state.settings.loading = false
            })
          }
        },
        async loadMarketFills() {
          const set = get().set
          const selectedMarket = get().selectedMarket.current
          const group = get().group
          const client = get().client
          const connection = get().connection
          try {
            let serumMarket
            let perpMarket
            if (!group || !selectedMarket) return

            if (selectedMarket instanceof Serum3Market) {
              serumMarket = group.getSerum3ExternalMarket(
                selectedMarket.serumMarketExternal
              )
            } else {
              perpMarket = selectedMarket
            }

            let loadedFills: any[] = []
            if (serumMarket) {
              loadedFills = await serumMarket.loadFills(connection, 10000)
              loadedFills = loadedFills.filter((f) => !f?.eventFlags?.maker)
            } else if (perpMarket) {
              loadedFills = await perpMarket.loadFills(client)
              loadedFills = loadedFills.reverse()
            }
            set((state) => {
              state.selectedMarket.fills = loadedFills
            })
          } catch (err) {
            console.error('Error fetching fills:', err)
          }
        },
        async fetchTradeHistory(offset = 0) {
          const set = get().set
          const mangoAccountPk =
            get().mangoAccount?.current?.publicKey.toString()
          const loadedHistory =
            mangoStore.getState().mangoAccount.tradeHistory.data
          try {
            const response = await fetch(
              `${MANGO_DATA_API_URL}/stats/trade-history?mango-account=${mangoAccountPk}&limit=${PAGINATION_PAGE_LENGTH}&offset=${offset}`
            )
            const jsonResponse = await response.json()
            if (jsonResponse?.length) {
              const newHistory = jsonResponse.map(
                (h: any) => h.activity_details
              )
              const history =
                offset !== 0 ? loadedHistory.concat(newHistory) : newHistory
              set((s) => {
                s.mangoAccount.tradeHistory.data = history?.sort(
                  (x: any) => x.block_datetime
                )
              })
            } else {
              set((s) => {
                s.mangoAccount.tradeHistory.data = []
              })
            }
          } catch (e) {
            console.error('Unable to fetch trade history', e)
          } finally {
            set((s) => {
              s.mangoAccount.tradeHistory.loading = false
            })
          }
        },
        updateConnection(endpointUrl) {
          const set = get().set
          const client = mangoStore.getState().client
          const newConnection = new web3.Connection(
            endpointUrl,
            CONNECTION_COMMITMENT
          )
          const oldProvider = client.program.provider as AnchorProvider
          const newProvider = new AnchorProvider(
            newConnection,
            oldProvider.wallet,
            options
          )
          newProvider.opts.skipPreflight = true
          const newClient = initMangoClient(newProvider)
          set((state) => {
            state.connection = newConnection
            state.client = newClient
          })
        },
      },
    }
  })
)

mangoStore.subscribe((state) => state.mangoAccount.current, spotBalancesUpdater)
mangoStore.subscribe(
  (state) => state.mangoAccount.openOrderAccounts,
  spotBalancesUpdater
)
mangoStore.subscribe(
  (state) => state.mangoAccount.current,
  perpPositionsUpdater
)

export default mangoStore
