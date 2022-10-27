import dayjs from 'dayjs'
import produce from 'immer'
import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { AnchorProvider, Wallet, web3 } from '@project-serum/anchor'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { TOKEN_LIST_URL } from '@jup-ag/core'
import { OpenOrders, Order } from '@project-serum/serum/lib/market'
import { Wallet as WalletAdapter } from '@solana/wallet-adapter-react'
import {
  MangoClient,
  Group,
  MangoAccount,
  Serum3Market,
  MANGO_V4_ID,
  Bank,
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
  COINGECKO_IDS,
  DEFAULT_MARKET_NAME,
  INPUT_TOKEN_DEFAULT,
  LAST_ACCOUNT_KEY,
  OUTPUT_TOKEN_DEFAULT,
} from '../utils/constants'
import { retryFn } from '../utils'
import { Orderbook, SpotBalances } from 'types'
import spotBalancesUpdater from './spotBalancesUpdater'
import { PerpMarket } from '@blockworks-foundation/mango-v4/'

const GROUP = new PublicKey('DLdcpC6AsAJ9xeKMR3WhHrN5sM5o7GVVXQhQ5vwisTtz')

export const connection = new web3.Connection(
  'https://mango.rpcpool.com/0f9acc0d45173b51bf7d7e09c1e5',
  'processed'
)
const options = AnchorProvider.defaultOptions()
export const CLUSTER = 'mainnet-beta'
const wallet = new EmptyWallet(Keypair.generate())
const DEFAULT_PROVIDER = new AnchorProvider(connection, wallet, options)
DEFAULT_PROVIDER.opts.skipPreflight = true
const DEFAULT_CLIENT = MangoClient.connect(
  DEFAULT_PROVIDER,
  CLUSTER,
  MANGO_V4_ID[CLUSTER],
  null,
  'get-program-accounts'
)

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

export type MangoStore = {
  activityFeed: {
    feed: Array<DepositWithdrawFeedItem | LiquidationFeedItem>
    loading: boolean
  }
  coingeckoPrices: {
    data: any[]
    loading: boolean
  }
  connected: boolean
  connection: Connection
  group: Group | undefined
  groupLoaded: boolean
  client: MangoClient
  jupiterTokens: Token[]
  mangoAccount: {
    current: MangoAccount | undefined
    initialLoad: boolean
    lastUpdatedAt: string
    openOrderAccounts: OpenOrders[]
    openOrders: Record<string, Order[]>
    spotBalances: SpotBalances
    stats: {
      interestTotals: { data: TotalInterestDataItem[]; loading: boolean }
      performance: { data: PerformanceDataItem[]; loading: boolean }
      swapHistory: { data: SwapHistoryItem[]; loading: boolean }
    }
  }
  mangoAccounts: MangoAccount[]
  markets: Serum3Market[] | undefined
  notificationIdCounter: number
  notifications: Array<Notification>
  perpMarkets: PerpMarket[]
  profile: {
    details: ProfileDetails
    loadDetails: boolean
  }
  selectedMarket: {
    name: string
    current: Serum3Market | PerpMarket | undefined
    orderbook: Orderbook
  }
  serumMarkets: Serum3Market[]
  serumOrders: Order[] | undefined
  settings: {
    loading: boolean
    tours: TourSettings
    uiLocked: boolean
  }
  swap: {
    inputBank: Bank | undefined
    outputBank: Bank | undefined
    inputTokenInfo: Token | undefined
    outputTokenInfo: Token | undefined
    margin: boolean
    slippage: number
  }
  set: (x: (x: MangoStore) => void) => void
  tradeForm: {
    side: 'buy' | 'sell'
    price: string
    baseSize: string
    quoteSize: string
    tradeType: 'Market' | 'Limit'
    postOnly: boolean
    ioc: boolean
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
    fetchCoingeckoPrices: () => Promise<void>
    fetchGroup: () => Promise<void>
    fetchJupiterTokens: () => Promise<void>
    reloadMangoAccount: () => Promise<void>
    fetchMangoAccounts: (wallet: Wallet) => Promise<void>
    fetchNfts: (connection: Connection, walletPk: PublicKey) => void
    fetchSerumOpenOrders: (ma?: MangoAccount) => Promise<void>
    fetchProfileDetails: (walletPk: string) => void
    fetchSwapHistory: (mangoAccountPk: string) => Promise<void>
    fetchTourSettings: (walletPk: string) => void
    fetchWalletTokens: (wallet: Wallet) => Promise<void>
    connectMangoClientWithWallet: (wallet: WalletAdapter) => Promise<void>
    reloadGroup: () => Promise<void>
  }
}

const mangoStore = create<MangoStore>()(
  subscribeWithSelector((_set, get) => {
    return {
      activityFeed: {
        feed: [],
        loading: true,
      },
      coingeckoPrices: {
        data: [],
        loading: false,
      },
      connected: false,
      connection,
      group: undefined,
      groupLoaded: false,
      client: DEFAULT_CLIENT,
      jupiterTokens: [],
      mangoAccount: {
        current: undefined,
        initialLoad: true,
        lastUpdatedAt: '',
        openOrderAccounts: [],
        openOrders: {},
        spotBalances: {},
        stats: {
          interestTotals: { data: [], loading: false },
          performance: { data: [], loading: false },
          swapHistory: { data: [], loading: false },
        },
      },
      mangoAccounts: [],
      markets: undefined,
      notificationIdCounter: 0,
      notifications: [],
      perpMarkets: [],
      profile: {
        loadDetails: false,
        details: { profile_name: '', trader_category: '', wallet_pk: '' },
      },
      selectedMarket: {
        name: 'ETH/USDC',
        current: undefined,
        orderbook: {
          bids: [],
          asks: [],
        },
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
      tradeForm: {
        side: 'buy',
        price: '',
        baseSize: '',
        quoteSize: '',
        tradeType: 'Limit',
        postOnly: false,
        ioc: false,
      },
      swap: {
        inputBank: undefined,
        outputBank: undefined,
        inputTokenInfo: undefined,
        outputTokenInfo: undefined,
        margin: true,
        slippage: 0.5,
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
            state.mangoAccount.stats.interestTotals.loading = true
          })
          try {
            const response = await fetch(
              `https://mango-transaction-log.herokuapp.com/v4/stats/interest-account-total?mango-account=${mangoAccountPk}`
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
              state.mangoAccount.stats.interestTotals.data = stats
              state.mangoAccount.stats.interestTotals.loading = false
            })
          } catch {
            set((state) => {
              state.mangoAccount.stats.interestTotals.loading = false
            })
            notify({
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
          set((state) => {
            state.mangoAccount.stats.performance.loading = true
          })
          try {
            const response = await fetch(
              `https://mango-transaction-log.herokuapp.com/v4/stats/performance_account?mango-account=${mangoAccountPk}&start-date=${dayjs()
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
              state.mangoAccount.stats.performance.data = stats.reverse()
              state.mangoAccount.stats.performance.loading = false
            })
          } catch {
            set((state) => {
              state.mangoAccount.stats.performance.loading = false
            })
            notify({
              title: 'Failed to load account performance data',
              type: 'error',
            })
          }
        },
        fetchActivityFeed: async (
          mangoAccountPk: string,
          offset = 0,
          params = ''
        ) => {
          const set = get().set
          const currentFeed = mangoStore.getState().activityFeed.feed
          try {
            const response = await fetch(
              `https://mango-transaction-log.herokuapp.com/v4/stats/activity-feed?mango-account=${mangoAccountPk}&offset=${offset}&limit=25${
                params ? params : ''
              }`
            )
            const parsedResponse = await response.json()
            const entries: any = Object.entries(parsedResponse).sort((a, b) =>
              b[0].localeCompare(a[0])
            )

            const feed = currentFeed.concat(
              entries
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
            )

            set((state) => {
              state.activityFeed.feed = feed
            })
          } catch {
            notify({
              title: 'Failed to account activity feed',
              type: 'error',
            })
          } finally {
            set((state) => {
              state.activityFeed.loading = false
            })
          }
        },
        fetchCoingeckoPrices: async () => {
          const set = get().set
          set((state) => {
            state.coingeckoPrices.loading = true
          })
          try {
            const promises: any = []
            for (const asset of COINGECKO_IDS) {
              promises.push(
                fetch(
                  `https://api.coingecko.com/api/v3/coins/${asset.id}/market_chart?vs_currency=usd&days=1`
                ).then((res) => res.json())
              )
            }

            const data = await Promise.all(promises)
            for (let i = 0; i < data.length; i++) {
              data[i].symbol = COINGECKO_IDS[i].symbol
            }
            set((state) => {
              state.coingeckoPrices.data = data
              state.coingeckoPrices.loading = false
            })
          } catch (e) {
            console.warn('Unable to load Coingecko prices')
            set((state) => {
              state.coingeckoPrices.loading = false
            })
          }
        },
        fetchGroup: async () => {
          try {
            const set = get().set
            const client = get().client
            const group = await client.getGroup(GROUP)

            const inputBank =
              group?.banksMapByName.get(INPUT_TOKEN_DEFAULT)?.[0]
            const outputBank =
              group?.banksMapByName.get(OUTPUT_TOKEN_DEFAULT)?.[0]
            const serumMarkets = Array.from(
              group.serum3MarketsMapByExternal.values()
            )
            const perpMarkets = Array.from(group.perpMarketsMapByName.values())

            set((state) => {
              state.group = group
              state.groupLoaded = true
              state.serumMarkets = serumMarkets
              state.perpMarkets = perpMarkets
              state.selectedMarket.current =
                state.selectedMarket.current ||
                getDefaultSelectedMarket(serumMarkets)
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
          } catch (e) {
            console.error('Error fetching group', e)
          }
        },
        reloadMangoAccount: async () => {
          const set = get().set
          const actions = get().actions
          try {
            const group = get().group
            const client = get().client
            const mangoAccount = get().mangoAccount.current
            if (!group) throw new Error('Group not loaded')
            if (!mangoAccount)
              throw new Error('No mango account exists for reload')

            const reloadedMangoAccount = await mangoAccount.reload(client)
            set((state) => {
              state.mangoAccount.current = reloadedMangoAccount
              state.mangoAccount.lastUpdatedAt = new Date().toISOString()
            })
          } catch (e) {
            console.error('Error reloading mango acct', e)
            actions.reloadMangoAccount()
          } finally {
            set((state) => {
              state.mangoAccount.initialLoad = false
            })
          }
        },
        fetchMangoAccounts: async (wallet) => {
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
              wallet.publicKey
            )
            if (!mangoAccounts?.length) return

            mangoAccounts.forEach((ma) => ma.reloadAccountData(client))

            let newSelectedMangoAccount = selectedMangoAccount
            if (!selectedMangoAccount) {
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
              await actions.fetchSerumOpenOrders(newSelectedMangoAccount)
            }

            set((state) => {
              state.mangoAccounts = mangoAccounts
              state.mangoAccount.current = newSelectedMangoAccount
              state.mangoAccount.lastUpdatedAt = new Date().toISOString()
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
        fetchSerumOpenOrders: async (providedMangoAccount) => {
          const set = get().set
          const client = get().client
          const group = await client.getGroup(GROUP)
          const mangoAccount =
            providedMangoAccount || get().mangoAccount.current

          if (!mangoAccount) return
          console.log('mangoAccount', mangoAccount)

          try {
            let openOrders: Record<string, Order[]> = {}
            for (const serum3Orders of mangoAccount.serum3) {
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
            if (Object.keys(openOrders).length) {
              const serumOpenOrderAccounts =
                await mangoAccount.loadSerum3OpenOrdersAccounts(client)
              set((s) => {
                s.mangoAccount.openOrders = openOrders
                s.mangoAccount.openOrderAccounts = serumOpenOrderAccounts
              })
            }
          } catch (e) {
            console.error('Failed loading open orders ', e)
          }
        },
        fetchSwapHistory: async (mangoAccountPk: string) => {
          const set = get().set
          set((state) => {
            state.mangoAccount.stats.swapHistory.loading = true
          })
          try {
            const history = await fetch(
              `https://mango-transaction-log.herokuapp.com/v4/stats/swap-history?mango-account=${mangoAccountPk}`
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

            set((state) => {
              state.mangoAccount.stats.swapHistory.data = sortedHistory
              state.mangoAccount.stats.swapHistory.loading = false
            })
          } catch {
            set((state) => {
              state.mangoAccount.stats.swapHistory.loading = false
            })
            notify({
              title: 'Failed to load account performance data',
              type: 'error',
            })
          }
        },
        fetchWalletTokens: async (wallet: Wallet) => {
          const set = get().set
          const connection = get().connection

          if (wallet.publicKey) {
            const token = await getTokenAccountsByOwnerWithWrappedSol(
              connection,
              wallet.publicKey
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
        fetchJupiterTokens: async () => {
          const set = mangoStore.getState().set
          const group = mangoStore.getState().group
          if (!group) {
            console.error(
              'Mango group unavailable; Loading jupiter tokens failed'
            )
            return
          }
          const bankMints = Array.from(group.banksMapByName.values()).map((b) =>
            b[0].mint.toString()
          )

          fetch(TOKEN_LIST_URL[CLUSTER])
            .then((response) => response.json())
            .then((result) => {
              const groupTokens = result.filter((t: any) =>
                bankMints.includes(t.address)
              )
              const inputTokenInfo = groupTokens.find(
                (t: any) => t.symbol === INPUT_TOKEN_DEFAULT
              )
              const outputTokenInfo = groupTokens.find(
                (t: any) => t.symbol === OUTPUT_TOKEN_DEFAULT
              )
              set((s) => {
                s.swap.inputTokenInfo = inputTokenInfo
                s.swap.outputTokenInfo = outputTokenInfo
                s.jupiterTokens = groupTokens
              })
            })
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
            const client = await MangoClient.connect(
              provider,
              CLUSTER,
              MANGO_V4_ID[CLUSTER],
              {
                prioritizationFee: 2,
                postSendTxCallback: ({ txid }: { txid: string }) => {
                  notify({
                    title: 'Transaction sent',
                    description: 'Waiting for confirmation',
                    type: 'confirm',
                    txid: txid,
                  })
                },
              },
              'get-program-accounts'
            )
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
        reloadGroup: async () => {
          try {
            const set = get().set
            const client = get().client
            const group = await client.getGroup(GROUP)

            set((state) => {
              state.group = group
            })
          } catch (e) {
            console.error('Error fetching group', e)
          }
        },
        async fetchProfileDetails(walletPk: string) {
          const set = get().set
          set((state) => {
            state.profile.loadDetails = true
          })
          try {
            const response = await fetch(
              `https://mango-transaction-log.herokuapp.com/v4/user-data/profile-details?wallet-pk=${walletPk}`
            )
            const data = await response.json()
            set((state) => {
              state.profile.details = data
              state.profile.loadDetails = false
            })
          } catch (e) {
            notify({ type: 'error', title: 'Failed to load profile details' })
            console.log(e)
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
              `https://mango-transaction-log.herokuapp.com/v4/user-data/settings-unsigned?wallet-pk=${walletPk}`
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
      },
    }
  })
)

mangoStore.subscribe((state) => state.mangoAccount.current, spotBalancesUpdater)

const getDefaultSelectedMarket = (markets: Serum3Market[]): Serum3Market => {
  return markets.find((m) => m.name === DEFAULT_MARKET_NAME) || markets[0]
}

export default mangoStore
