import dayjs from 'dayjs'
import produce from 'immer'
import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  AnchorProvider,
  Wallet as AnchorWallet,
  web3,
} from '@project-serum/anchor'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { getProfilePicture, ProfilePicture } from '@solflare-wallet/pfp'
import { TOKEN_LIST_URL } from '@jup-ag/core'
import { Order } from '@project-serum/serum/lib/market'
import { Wallet } from '@solana/wallet-adapter-react'
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

const GROUP = new PublicKey('DLdcpC6AsAJ9xeKMR3WhHrN5sM5o7GVVXQhQ5vwisTtz')

export const connection = new web3.Connection(
  'https://mango.rpcpool.com/946ef7337da3f5b8d3e4a34e7f88',
  'processed'
)
const options = AnchorProvider.defaultOptions()
export const CLUSTER = 'mainnet-beta'
const DEFAULT_PROVIDER = new AnchorProvider(
  connection,
  new EmptyWallet(Keypair.generate()),
  options
)
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

export interface TradeHistoryItem {
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

export type MangoStore = {
  coingeckoPrices: {
    data: any[]
    loading: boolean
  }
  connected: boolean
  connection: Connection
  group: Group | undefined
  client: MangoClient
  jupiterTokens: Token[]
  mangoAccount: {
    current: MangoAccount | undefined
    initialLoad: boolean
    lastUpdatedAt: string
    openOrders: Order[]
    stats: {
      interestTotals: { data: TotalInterestDataItem[]; loading: boolean }
      performance: { data: PerformanceDataItem[]; loading: boolean }
      tradeHistory: { data: TradeHistoryItem[]; loading: boolean }
    }
  }
  mangoAccounts: { accounts: MangoAccount[] }
  markets: Serum3Market[] | undefined
  notificationIdCounter: number
  notifications: Array<Notification>
  selectedMarket: {
    name: string
    current: Serum3Market | undefined
    orderbook: {
      bids: number[][]
      asks: number[][]
    }
  }
  serumMarkets: Serum3Market[]
  serumOrders: Order[] | undefined
  swap: {
    inputBank: Bank | undefined
    outputBank: Bank | undefined
    inputTokenInfo: Token | undefined
    outputTokenInfo: Token | undefined
    margin: boolean
    slippage: number
  }
  set: (x: (x: MangoStore) => void) => void
  settings: {
    uiLocked: boolean
  }
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
    loadProfilePic: boolean
    profilePic: ProfilePicture | undefined
    tokens: TokenAccount[]
    nfts: {
      data: NFT[] | []
      loading: boolean
    }
  }
  actions: {
    fetchAccountInterestTotals: (mangoAccountPk: string) => Promise<void>
    fetchAccountPerformance: (
      mangoAccountPk: string,
      range: number
    ) => Promise<void>
    fetchCoingeckoPrices: () => Promise<void>
    fetchGroup: () => Promise<void>
    fetchJupiterTokens: () => Promise<void>
    reloadMangoAccount: () => Promise<void>
    fetchMangoAccounts: (wallet: AnchorWallet) => Promise<void>
    fetchNfts: (connection: Connection, walletPk: PublicKey) => void
    fetchOpenOrdersForMarket: (market: Serum3Market) => Promise<void>
    fetchProfilePicture: (wallet: AnchorWallet) => void
    fetchTradeHistory: (mangoAccountPk: string) => Promise<void>
    fetchWalletTokens: (wallet: AnchorWallet) => Promise<void>
    connectMangoClientWithWallet: (wallet: Wallet) => Promise<void>
    reloadGroup: () => Promise<void>
  }
}

const mangoStore = create<MangoStore>()(
  subscribeWithSelector((_set, get) => {
    return {
      coingeckoPrices: {
        data: [],
        loading: false,
      },
      connected: false,
      connection,
      group: undefined,
      client: DEFAULT_CLIENT,
      jupiterTokens: [],
      mangoAccount: {
        current: undefined,
        initialLoad: true,
        lastUpdatedAt: '',
        openOrders: [],
        stats: {
          interestTotals: { data: [], loading: false },
          performance: { data: [], loading: false },
          tradeHistory: { data: [], loading: false },
        },
      },
      mangoAccounts: { accounts: [] },
      markets: undefined,
      notificationIdCounter: 0,
      notifications: [],
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
        loadProfilePic: true,
        profilePic: undefined,
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

            set((state) => {
              state.group = group
              state.serumMarkets = serumMarkets
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

            const reloadedMangoAccount = await mangoAccount.reload(
              client,
              group
            )
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
              await retryFn(() =>
                newSelectedMangoAccount!.reloadAccountData(client, group)
              )
            }

            set((state) => {
              state.mangoAccounts.accounts = mangoAccounts
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
        fetchOpenOrdersForMarket: async (market) => {
          const set = get().set
          const client = get().client
          const group = await client.getGroup(GROUP)
          const mangoAccount = get().mangoAccount.current

          if (!mangoAccount) return
          try {
            const orders = await mangoAccount.loadSerum3OpenOrdersForMarket(
              client,
              group,
              market.serumMarketExternal
            )
            set((s) => {
              s.mangoAccount.openOrders = orders
            })
          } catch (e) {
            console.error('Failed loading open orders ', e)
          }
        },
        fetchTradeHistory: async (mangoAccountPk: string) => {
          const set = get().set
          set((state) => {
            state.mangoAccount.stats.tradeHistory.loading = true
          })
          try {
            const history = await fetch(
              `https://mango-transaction-log.herokuapp.com/v4/stats/swap-history?mango-account=${mangoAccountPk}`
            )
            const parsedHistory = await history.json()
            const sortedHistory =
              parsedHistory && parsedHistory.length
                ? parsedHistory.sort(
                    (a: TradeHistoryItem, b: TradeHistoryItem) =>
                      dayjs(b.block_datetime).unix() -
                      dayjs(a.block_datetime).unix()
                  )
                : []

            set((state) => {
              state.mangoAccount.stats.tradeHistory.data = sortedHistory
              state.mangoAccount.stats.tradeHistory.loading = false
            })
          } catch {
            set((state) => {
              state.mangoAccount.stats.tradeHistory.loading = false
            })
            notify({
              title: 'Failed to load account performance data',
              type: 'error',
            })
          }
        },
        fetchWalletTokens: async (wallet: AnchorWallet) => {
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
        connectMangoClientWithWallet: async (wallet: Wallet) => {
          const set = get().set
          try {
            const provider = new AnchorProvider(
              connection,
              wallet.adapter as unknown as AnchorWallet,
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
              }
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
        async fetchProfilePicture(wallet: AnchorWallet) {
          const set = get().set
          const walletPk = wallet?.publicKey
          const connection = get().connection

          if (!walletPk) return

          try {
            const result = await getProfilePicture(connection, walletPk)

            set((state) => {
              state.wallet.profilePic = result
              state.wallet.loadProfilePic = false
            })
          } catch (e) {
            console.error('Could not get profile picture', e)
            set((state) => {
              state.wallet.loadProfilePic = false
            })
          }
        },
      },
    }
  })
)

const getDefaultSelectedMarket = (markets: Serum3Market[]): Serum3Market => {
  return markets.find((m) => m.name === DEFAULT_MARKET_NAME) || markets[0]
}

export default mangoStore
