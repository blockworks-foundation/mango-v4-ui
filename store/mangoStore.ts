import dayjs from 'dayjs'
import produce from 'immer'
import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { AnchorProvider, BN, Wallet, web3 } from '@coral-xyz/anchor'
import { ConfirmOptions, Connection, Keypair, PublicKey } from '@solana/web3.js'
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
  ParsedFillEvent,
  getLargestPerpPositions,
  getClosestToLiquidationPerpPositions,
} from '@blockworks-foundation/mango-v4'

import EmptyWallet from '../utils/wallet'
import { TransactionNotification, notify } from '../utils/notifications'
import {
  getNFTsByOwner,
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
  SWAP_MARGIN_KEY,
} from '../utils/constants'
import {
  ActivityFeed,
  EmptyObject,
  OrderbookL2,
  PerpStatsItem,
  PerpTradeHistory,
  SerumEvent,
  SpotBalances,
  SpotTradeHistory,
  SwapHistoryItem,
  TotalInterestDataItem,
  TradeForm,
  TokenStatsItem,
  NFT,
  TourSettings,
  ProfileDetails,
  MangoTokenStatsItem,
  ThemeData,
  PositionStat,
  OrderbookTooltip,
} from 'types'
import spotBalancesUpdater from './spotBalancesUpdater'
import { PerpMarket } from '@blockworks-foundation/mango-v4/'
import perpPositionsUpdater from './perpPositionsUpdater'
import {
  DEFAULT_PRIORITY_FEE,
  TRITON_DEDICATED_URL,
} from '@components/settings/RpcSettings'
import {
  IExecutionLineAdapter,
  IOrderLineAdapter,
} from '@public/charting_library/charting_library'
import { nftThemeMeta } from 'utils/theme'

const GROUP = new PublicKey('78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX')

const ENDPOINTS = [
  {
    name: 'mainnet-beta',
    url: process.env.NEXT_PUBLIC_ENDPOINT || TRITON_DEDICATED_URL,
    websocket: process.env.NEXT_PUBLIC_ENDPOINT || TRITON_DEDICATED_URL,
    custom: false,
  },
  {
    name: 'devnet',
    url: 'https://realms-develope-935c.devnet.rpcpool.com/67f608dc-a353-4191-9c34-293a5061b536',
    websocket:
      'https://realms-develope-935c.devnet.rpcpool.com/67f608dc-a353-4191-9c34-293a5061b536',
    custom: false,
  },
]

const options = {
  ...AnchorProvider.defaultOptions(),
  preflightCommitment: 'confirmed',
} as ConfirmOptions
export const CLUSTER: 'mainnet-beta' | 'devnet' = 'mainnet-beta'
const ENDPOINT = ENDPOINTS.find((e) => e.name === CLUSTER) || ENDPOINTS[0]
export const emptyWallet = new EmptyWallet(Keypair.generate())

const initMangoClient = (
  provider: AnchorProvider,
  opts = { prioritizationFee: DEFAULT_PRIORITY_FEE.value },
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
export const DEFAULT_TRADE_FORM: TradeForm = {
  side: 'buy',
  price: undefined,
  baseSize: '',
  quoteSize: '',
  tradeType: 'Limit',
  triggerPrice: '',
  postOnly: false,
  ioc: false,
  reduceOnly: false,
}

export type MangoStore = {
  activityFeed: {
    feed: Array<ActivityFeed>
    loading: boolean
    queryParams: string
  }
  connected: boolean
  connection: Connection
  group: Group | undefined
  groupLoaded: boolean
  client: MangoClient
  showUserSetup: boolean
  mangoAccount: {
    current: MangoAccount | undefined
    initialLoad: boolean
    lastSlot: number
    openOrderAccounts: OpenOrders[]
    openOrders: Record<string, Order[] | PerpOrder[]>
    perpPositions: PerpPosition[]
    spotBalances: SpotBalances
    interestTotals: { data: TotalInterestDataItem[]; loading: boolean }
    swapHistory: {
      data: SwapHistoryItem[]
      initialLoad: boolean
      loading: boolean
    }
    tradeHistory: {
      data: Array<SpotTradeHistory | PerpTradeHistory>
      loading: boolean
    }
  }
  mangoAccounts: MangoAccount[]
  markets: Serum3Market[] | undefined
  transactionNotificationIdCounter: number
  transactionNotifications: Array<TransactionNotification>
  perpMarkets: PerpMarket[]
  perpStats: {
    loading: boolean
    data: PerpStatsItem[] | null
    positions: {
      initialLoad: boolean
      loading: boolean
      largest: PositionStat[]
      closestToLiq: PositionStat[]
    }
  }
  orderbookTooltip: OrderbookTooltip | undefined
  profile: {
    details: ProfileDetails | null
    loadDetails: boolean
  }
  selectedMarket: {
    name: string | undefined
    current: Serum3Market | PerpMarket | undefined
    fills: (ParsedFillEvent | SerumEvent)[]
    bidsAccount: BookSide | Orderbook | undefined
    asksAccount: BookSide | Orderbook | undefined
    orderbook: OrderbookL2
    markPrice: number
    lastSeenSlot: {
      bids: number
      asks: number
    }
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
    theme: boolean
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
    flipPrices: boolean
  }
  set: (x: (x: MangoStore) => void) => void
  themeData: ThemeData
  tokenStats: {
    initialLoad: boolean
    loading: boolean
    data: TokenStatsItem[] | null
    mangoStats: MangoTokenStatsItem[]
  }
  tradeForm: TradeForm
  tradingView: {
    orderLines: Map<string | BN, IOrderLineAdapter>
    tradeExecutions: Map<string, IExecutionLineAdapter>
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
      params?: string,
      limit?: number,
    ) => Promise<void>
    fetchGroup: () => Promise<void>
    reloadMangoAccount: (slot?: number) => Promise<void>
    fetchMangoAccounts: (ownerPk: PublicKey) => Promise<void>
    fetchNfts: (connection: Connection, walletPk: PublicKey) => void
    fetchOpenOrders: (refetchMangoAccount?: boolean) => Promise<void>
    fetchPerpStats: () => void
    fetchPositionsStats: () => void
    fetchProfileDetails: (walletPk: string) => void
    fetchSwapHistory: (
      mangoAccountPk: string,
      timeout?: number,
      offset?: number,
      limit?: number,
    ) => Promise<void>
    fetchTokenStats: () => void
    fetchTourSettings: (walletPk: string) => void
    fetchWalletTokens: (walletPk: PublicKey) => Promise<void>
    connectMangoClientWithWallet: (wallet: WalletAdapter) => Promise<void>
    loadMarketFills: () => Promise<void>
    updateConnection: (url: string) => void
  }
}

const mangoStore = create<MangoStore>()(
  subscribeWithSelector((_set, get) => {
    let rpcUrl = ENDPOINT.url
    let swapMargin = true

    if (typeof window !== 'undefined' && CLUSTER === 'mainnet-beta') {
      const urlFromLocalStorage = localStorage.getItem(RPC_PROVIDER_KEY)
      const swapMarginFromLocalStorage = localStorage.getItem(SWAP_MARGIN_KEY)
      rpcUrl = urlFromLocalStorage
        ? JSON.parse(urlFromLocalStorage)
        : ENDPOINT.url
      swapMargin = swapMarginFromLocalStorage
        ? JSON.parse(swapMarginFromLocalStorage)
        : true
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
      showUserSetup: false,
      mangoAccount: {
        current: undefined,
        initialLoad: true,
        lastSlot: 0,
        openOrderAccounts: [],
        openOrders: {},
        perpPositions: [],
        spotBalances: {},
        interestTotals: { data: [], loading: false },
        swapHistory: { data: [], loading: true, initialLoad: true },
        tradeHistory: { data: [], loading: true },
      },
      mangoAccounts: [],
      markets: undefined,
      transactionNotificationIdCounter: 0,
      transactionNotifications: [],
      perpMarkets: [],
      perpStats: {
        loading: false,
        data: [],
        positions: {
          initialLoad: true,
          loading: true,
          largest: [],
          closestToLiq: [],
        },
      },
      orderbookTooltip: undefined,
      profile: {
        loadDetails: false,
        details: { profile_name: '', trader_category: '', wallet_pk: '' },
      },
      selectedMarket: {
        name: 'SOL/USDC',
        current: undefined,
        fills: [],
        bidsAccount: undefined,
        asksAccount: undefined,
        lastSeenSlot: {
          bids: 0,
          asks: 0,
        },
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
        theme: false,
        trade: false,
      },
      swap: {
        inputBank: undefined,
        outputBank: undefined,
        inputTokenInfo: undefined,
        outputTokenInfo: undefined,
        margin: swapMargin,
        slippage: 0.5,
        swapMode: 'ExactIn',
        amountIn: '',
        amountOut: '',
        flipPrices: false,
      },
      themeData: nftThemeMeta.default,
      tokenStats: {
        initialLoad: false,
        loading: true,
        data: [],
        mangoStats: [],
      },
      tradeForm: DEFAULT_TRADE_FORM,
      tradingView: {
        orderLines: new Map(),
        tradeExecutions: new Map(),
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
              `${MANGO_DATA_API_URL}/stats/interest-account-total?mango-account=${mangoAccountPk}`,
            )
            const parsedResponse:
              | Omit<TotalInterestDataItem, 'symbol'>[]
              | null = await response.json()
            if (parsedResponse) {
              const entries: [string, Omit<TotalInterestDataItem, 'symbol'>][] =
                Object.entries(parsedResponse).sort((a, b) =>
                  b[0].localeCompare(a[0]),
                )

              const stats: TotalInterestDataItem[] = entries
                .map(([key, value]) => {
                  return { ...value, symbol: key }
                })
                .filter((x) => x)

              set((state) => {
                state.mangoAccount.interestTotals.data = stats
                state.mangoAccount.interestTotals.loading = false
              })
            }
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
        fetchActivityFeed: async (
          mangoAccountPk: string,
          offset = 0,
          params = '',
          limit = PAGINATION_PAGE_LENGTH,
        ) => {
          const set = get().set
          const loadedFeed = mangoStore.getState().activityFeed.feed

          try {
            const response = await fetch(
              `${MANGO_DATA_API_URL}/stats/activity-feed?mango-account=${mangoAccountPk}&offset=${offset}&limit=${limit}${
                params ? params : ''
              }`,
            )
            const parsedResponse: null | EmptyObject | Array<ActivityFeed> =
              await response.json()

            if (Array.isArray(parsedResponse)) {
              const entries = Object.entries(parsedResponse).sort((a, b) =>
                b[0].localeCompare(a[0]),
              )

              const latestFeed = entries
                .map(([key, value]) => {
                  // ETH should be renamed to ETH (Portal) in the database
                  const symbol = value.activity_details.symbol
                  if (symbol === 'ETH') {
                    value.activity_details.symbol = 'ETH (Portal)'
                  }
                  return {
                    ...value,
                    symbol: key,
                  }
                })
                .sort(
                  (a, b) =>
                    dayjs(b.block_datetime).unix() -
                    dayjs(a.block_datetime).unix(),
                )

              // only add to current feed if data request is offset and the mango account hasn't changed
              const combinedFeed =
                offset !== 0 ? loadedFeed.concat(latestFeed) : latestFeed

              set((state) => {
                state.activityFeed.feed = combinedFeed
              })
            }
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
            let selectedMarketName = get().selectedMarket.name

            if (!selectedMarketName) {
              selectedMarketName = DEFAULT_MARKET_NAME
            }

            const inputBank =
              group?.banksMapByName.get(INPUT_TOKEN_DEFAULT)?.[0]
            const outputBank =
              group?.banksMapByName.get(OUTPUT_TOKEN_DEFAULT)?.[0]
            const serumMarkets = Array.from(
              group.serum3MarketsMapByExternal.values(),
            ).map((m) => {
              // remove this when market name is updated
              if (m.name === 'MSOL/SOL') {
                m.name = 'mSOL/SOL'
              }
              return m
            })

            const perpMarkets = Array.from(group.perpMarketsMapByName.values())
              .filter(
                (p) =>
                  p.publicKey.toString() !==
                  '9Y8paZ5wUpzLFfQuHz8j2RtPrKsDtHx9sbgFmWb5abCw',
              )
              .sort((a, b) => a.name.localeCompare(b.name))

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
                  state.swap.inputBank!.mint,
                )
                state.swap.outputBank = group.getFirstBankByMint(
                  state.swap.outputBank!.mint,
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
        reloadMangoAccount: async (confirmationSlot) => {
          const set = get().set
          const actions = get().actions
          try {
            const group = get().group
            const client = get().client
            const mangoAccount = get().mangoAccount.current
            if (!group) throw new Error('Group not loaded')
            if (!mangoAccount)
              throw new Error('No mango account exists for reload')

            const { value: reloadedMangoAccount, slot } =
              await mangoAccount.reloadWithSlot(client)
            const lastSlot = get().mangoAccount.lastSlot
            if (
              !confirmationSlot ||
              (confirmationSlot && slot > confirmationSlot)
            ) {
              if (slot > lastSlot) {
                const ma = get().mangoAccounts.find((ma) =>
                  ma.publicKey.equals(reloadedMangoAccount.publicKey),
                )
                if (ma) {
                  Object.assign(ma, reloadedMangoAccount)
                }
                set((state) => {
                  state.mangoAccount.current = reloadedMangoAccount
                  state.mangoAccount.lastSlot = slot
                })
              }
            } else if (confirmationSlot && slot < confirmationSlot) {
              actions.reloadMangoAccount(confirmationSlot)
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

            const [ownerMangoAccounts, delegateAccounts] = await Promise.all([
              client.getMangoAccountsForOwner(group, ownerPk),
              client.getMangoAccountsForDelegate(group, ownerPk),
            ])
            const mangoAccounts = [...ownerMangoAccounts, ...delegateAccounts]
            const selectedAccountIsNotInAccountsList = mangoAccounts.find(
              (x) =>
                x.publicKey.toBase58() ===
                selectedMangoAccount?.publicKey.toBase58(),
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
              let lastViewedAccount
              if (typeof lastAccount === 'string') {
                try {
                  lastViewedAccount = mangoAccounts.find(
                    (m) => m.publicKey.toString() === JSON.parse(lastAccount),
                  )
                } catch (e) {
                  console.error('Error parsing last account', e)
                }
                newSelectedMangoAccount = lastViewedAccount || mangoAccounts[0]
              }
            }

            if (newSelectedMangoAccount) {
              await newSelectedMangoAccount.reloadSerum3OpenOrders(client)
              set((state) => {
                state.mangoAccount.current = newSelectedMangoAccount
                state.mangoAccount.initialLoad = false
              })
              actions.fetchOpenOrders()
            }

            await Promise.all(
              mangoAccounts.map((ma) => ma.reloadSerum3OpenOrders(client)),
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
            const nfts = await getNFTsByOwner(ownerPk, connection)
            set((state) => {
              state.wallet.nfts.data = nfts
            })
          } catch (error) {
            notify({
              type: 'error',
              title: 'Unable to fetch nfts',
            })
          } finally {
            set((state) => {
              state.wallet.nfts.loading = false
            })
          }
        },
        fetchOpenOrders: async (refetchMangoAccount = false) => {
          const set = get().set
          const client = get().client
          const group = get().group
          if (refetchMangoAccount) {
            await get().actions.reloadMangoAccount()
          }
          const mangoAccount = get().mangoAccount.current
          if (!mangoAccount || !group) return

          try {
            const openOrders: Record<string, Order[] | PerpOrder[]> = {}
            let serumOpenOrderAccounts: OpenOrders[] = []

            const activeSerumMarketIndices = [
              ...new Set(mangoAccount.serum3Active().map((s) => s.marketIndex)),
            ]
            if (activeSerumMarketIndices.length) {
              await Promise.all(
                activeSerumMarketIndices.map(async (serum3Orders) => {
                  const market =
                    group.getSerum3MarketByMarketIndex(serum3Orders)
                  if (market) {
                    const orders =
                      await mangoAccount.loadSerum3OpenOrdersForMarket(
                        client,
                        group,
                        market.serumMarketExternal,
                      )
                    openOrders[market.serumMarketExternal.toString()] = orders
                  }
                }),
              )
            }

            if (mangoAccount.serum3Active().length) {
              serumOpenOrderAccounts = Array.from(
                mangoAccount.serum3OosMapByMarketIndex.values(),
              )
              await mangoAccount.loadSerum3OpenOrdersAccounts(client)
            }

            const activePerpMarketIndices = [
              ...new Set(
                mangoAccount.perpOrdersActive().map((p) => p.orderMarket),
              ),
            ]
            await Promise.all(
              activePerpMarketIndices.map(async (perpMktIndex) => {
                const market = group.getPerpMarketByMarketIndex(perpMktIndex)
                const orders = await mangoAccount.loadPerpOpenOrdersForMarket(
                  client,
                  group,
                  perpMktIndex,
                  market._bids ? false : true,
                )
                openOrders[market.publicKey.toString()] = orders
              }),
            )

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
          if (!group) return []
          set((state) => {
            state.perpStats.loading = true
          })
          try {
            const response = await fetch(
              `${MANGO_DATA_API_URL}/perp-historical-stats?mango-group=${group?.publicKey.toString()}`,
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
        fetchPositionsStats: async () => {
          const set = get().set
          const group = get().group
          const client = get().client
          if (!group) return
          try {
            const allMangoAccounts = await client.getAllMangoAccounts(
              group,
              true,
            )
            if (allMangoAccounts && allMangoAccounts.length) {
              const [largestPositions, closestToLiq]: [
                PositionStat[],
                PositionStat[],
              ] = await Promise.all([
                getLargestPerpPositions(client, group, allMangoAccounts),
                getClosestToLiquidationPerpPositions(
                  client,
                  group,
                  allMangoAccounts,
                ),
              ])
              set((state) => {
                if (largestPositions && largestPositions.length) {
                  const positionsToShow = largestPositions.slice(0, 5)
                  for (const position of positionsToShow) {
                    const ma = allMangoAccounts.find(
                      (acc) => acc.publicKey === position.mangoAccount,
                    )
                    position.account = ma
                  }
                  state.perpStats.positions.largest = positionsToShow
                }
                if (closestToLiq && closestToLiq.length) {
                  const positionsToShow = closestToLiq.slice(0, 5)
                  for (const position of positionsToShow) {
                    const ma = allMangoAccounts.find(
                      (acc) => acc.publicKey === position.mangoAccount,
                    )
                    position.account = ma
                  }
                  state.perpStats.positions.closestToLiq = positionsToShow
                }
              })
            }
          } catch (e) {
            console.log('failed to fetch perp positions stats', e)
          } finally {
            const notLoaded =
              mangoStore.getState().perpStats.positions.initialLoad
            set((state) => {
              state.perpStats.positions.loading = false
              if (notLoaded) {
                state.perpStats.positions.initialLoad = false
              }
            })
          }
        },
        fetchSwapHistory: async (
          mangoAccountPk: string,
          timeout = 0,
          offset = 0,
          limit = PAGINATION_PAGE_LENGTH,
        ) => {
          const set = get().set
          const loadedSwapHistory =
            mangoStore.getState().mangoAccount.swapHistory.data

          setTimeout(async () => {
            try {
              const history = await fetch(
                `${MANGO_DATA_API_URL}/stats/swap-history?mango-account=${mangoAccountPk}&offset=${offset}&limit=${limit}`,
              )
              const parsedHistory = await history.json()
              const sortedHistory =
                parsedHistory && parsedHistory.length
                  ? parsedHistory.sort(
                      (a: SwapHistoryItem, b: SwapHistoryItem) =>
                        dayjs(b.block_datetime).unix() -
                        dayjs(a.block_datetime).unix(),
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
              const notLoaded =
                mangoStore.getState().mangoAccount.swapHistory.initialLoad
              set((state) => {
                state.mangoAccount.swapHistory.loading = false
                if (notLoaded) {
                  state.mangoAccount.swapHistory.initialLoad = false
                }
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
              `${MANGO_DATA_API_URL}/token-historical-stats?mango-group=${group?.publicKey.toString()}`,
            )
            const data = await response.json()
            let mangoStats: MangoTokenStatsItem[] = []
            if (data && data.length) {
              mangoStats = data.reduce(
                (a: MangoTokenStatsItem[], c: TokenStatsItem) => {
                  const banks = Array.from(group.banksMapByMint)
                    .map(([_mintAddress, banks]) => banks)
                    .map((b) => b[0])
                  const bank: Bank | undefined = banks.find(
                    (b) => b.tokenIndex === c.token_index,
                  )
                  const hasDate = a.find(
                    (d: MangoTokenStatsItem) => d.date === c.date_hour,
                  )
                  if (!hasDate) {
                    a.push({
                      date: c.date_hour,
                      depositValue: Math.floor(c.total_deposits * c.price),
                      borrowValue: Math.floor(c.total_borrows * c.price),
                      feesCollected: c.collected_fees * bank!.uiPrice,
                    })
                  } else {
                    hasDate.depositValue =
                      hasDate.depositValue +
                      Math.floor(c.total_deposits * c.price)
                    hasDate.borrowValue =
                      hasDate.borrowValue +
                      Math.floor(c.total_borrows * c.price)
                    hasDate.feesCollected =
                      hasDate.feesCollected + c.collected_fees * bank!.uiPrice
                  }
                  return a.sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime(),
                  )
                },
                [],
              )
            }
            set((state) => {
              state.tokenStats.data = data
              state.tokenStats.mangoStats = mangoStats
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
            try {
              const token = await getTokenAccountsByOwnerWithWrappedSol(
                connection,
                walletPk,
              )

              set((state) => {
                state.wallet.tokens = token
              })
            } catch (e) {
              notify({
                title: 'Failed to refresh wallet balances.',
                type: 'info',
              })
            }
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
              options,
            )
            provider.opts.skipPreflight = true
            const prioritizationFee = Number(
              localStorage.getItem(PRIORITY_FEE_KEY) ??
                DEFAULT_PRIORITY_FEE.value,
            )
            const client = initMangoClient(provider, { prioritizationFee })

            set((s) => {
              s.client = client
            })
          } catch (e) {
            if (e instanceof Error && e.name.includes('WalletLoadError')) {
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
              `${MANGO_DATA_API_URL}/user-data/profile-details?wallet-pk=${walletPk}`,
            )
            const data = await response.json()
            set((state) => {
              state.profile.details = data
              state.profile.loadDetails = false
            })
          } catch (e) {
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
              `${MANGO_DATA_API_URL}/user-data/settings-unsigned?wallet-pk=${walletPk}`,
            )
            const data = await response.json()
            set((state) => {
              state.settings.tours = data
              state.settings.loading = false
            })
          } catch (e) {
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
                selectedMarket.serumMarketExternal,
              )
            } else {
              perpMarket = selectedMarket
            }

            let loadedFills: (ParsedFillEvent | SerumEvent)[] = []
            if (serumMarket) {
              const serumFills = (await serumMarket.loadFills(
                connection,
                10000,
              )) as SerumEvent[]
              loadedFills = serumFills.filter((f) => !f?.eventFlags?.maker)
            } else if (perpMarket) {
              const perpFills = (await perpMarket.loadFills(
                client,
              )) as unknown as ParsedFillEvent[]
              loadedFills = perpFills.reverse()
            }
            set((state) => {
              state.selectedMarket.fills = loadedFills
            })
          } catch (err) {
            console.error('Error fetching fills:', err)
          }
        },
        updateConnection(endpointUrl) {
          const set = get().set
          const client = mangoStore.getState().client
          const newConnection = new web3.Connection(
            endpointUrl,
            CONNECTION_COMMITMENT,
          )
          const oldProvider = client.program.provider as AnchorProvider
          const newProvider = new AnchorProvider(
            newConnection,
            oldProvider.wallet,
            options,
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
  }),
)

mangoStore.subscribe((state) => state.mangoAccount.current, spotBalancesUpdater)
mangoStore.subscribe(
  (state) => state.mangoAccount.openOrderAccounts,
  spotBalancesUpdater,
)
mangoStore.subscribe(
  (state) => state.mangoAccount.current,
  perpPositionsUpdater,
)

export default mangoStore
