import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import produce from 'immer'
import { AnchorProvider, Wallet, web3 } from '@project-serum/anchor'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import {
  MangoClient,
  Group,
  MangoAccount,
  Serum3Market,
  MANGO_V4_ID,
} from '@blockworks-foundation/mango-v4'
import EmptyWallet from '../utils/wallet'
import { Order } from '@project-serum/serum/lib/market'
import { Notification, notify } from '../utils/notifications'
import {
  fetchNftsFromHolaplexIndexer,
  getTokenAccountsByOwnerWithWrappedSol,
  TokenAccount,
} from '../utils/tokens'
import { Token } from '../types/jupiter'
import { getProfilePicture, ProfilePicture } from '@solflare-wallet/pfp'
import { TOKEN_LIST_URL } from '@jup-ag/core'

const DEVNET_GROUP = new PublicKey(
  'A9XhGqUUjV992cD36qWDY8wDiZnGuCaUWtSE3NGXjDCb'
)

export const connection = new web3.Connection(
  'https://mango.rpcpool.com/946ef7337da3f5b8d3e4a34e7f88',
  'processed'
)
const options = AnchorProvider.defaultOptions()
export const CLUSTER = 'mainnet-beta'
export const CLIENT_TX_TIMEOUT = 90000
const DEFAULT_PROVIDER = new AnchorProvider(
  connection,
  new EmptyWallet(Keypair.generate()),
  options
)
DEFAULT_PROVIDER.opts.skipPreflight = true
const DEFAULT_CLIENT = MangoClient.connect(
  DEFAULT_PROVIDER,
  CLUSTER,
  MANGO_V4_ID[CLUSTER]
)

interface NFT {
  address: string
  image: string
}

export type MangoStore = {
  connected: boolean
  connection: Connection
  group: Group | undefined
  client: MangoClient
  jupiterTokens: Token[]
  mangoAccount: {
    current: MangoAccount | undefined
    loading: boolean
  }
  mangoAccounts: MangoAccount[]
  markets: Serum3Market[] | undefined
  notificationIdCounter: number
  notifications: Array<Notification>
  serumOrders: Order[] | undefined
  swap: {
    inputToken: string
    outputToken: string
    inputTokenInfo: any
    outputTokenInfo: any
  }
  set: (x: (x: MangoStore) => void) => void
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
    fetchGroup: () => Promise<void>
    fetchMangoAccount: (wallet: Wallet) => Promise<void>
    fetchMangoAccounts: (wallet: Wallet) => Promise<void>
    fetchNfts: (connection: Connection, walletPk: PublicKey) => void
    fetchProfilePicture: (wallet: Wallet) => void
    fetchJupiterTokens: () => Promise<void>
    fetchWalletTokens: (wallet: Wallet) => Promise<void>
    reloadAccount: () => Promise<void>
    reloadGroup: () => Promise<void>
    loadSerumMarket: () => Promise<void>
  }
}

const mangoStore = create<MangoStore>(
  subscribeWithSelector((set, get) => {
    return {
      connected: false,
      connection,
      group: undefined,
      client: DEFAULT_CLIENT,
      jupiterTokens: [],
      mangoAccount: {
        current: undefined,
        loading: false,
      },
      mangoAccounts: [],
      markets: undefined,
      notificationIdCounter: 0,
      notifications: [],
      serumOrders: undefined,
      set: (fn) => set(produce(fn)),
      swap: {
        inputToken: 'SOL',
        outputToken: 'USDC',
        inputTokenInfo: undefined,
        outputTokenInfo: undefined,
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
        fetchGroup: async () => {
          try {
            const set = get().set
            const client = get().client
            const group = await client.getGroup(DEVNET_GROUP)
            const markets = await client.serum3GetMarkets(
              group,
              group.banksMap.get('BTC')?.tokenIndex,
              group.banksMap.get('USDC')?.tokenIndex
            )

            set((state) => {
              state.group = group
              state.markets = markets
            })
          } catch (e) {
            console.error('Error fetching group', e)
          }
        },
        fetchMangoAccount: async (wallet) => {
          try {
            const set = get().set
            const group = get().group
            if (!group) throw new Error('Group not loaded')

            const provider = new AnchorProvider(connection, wallet, options)
            provider.opts.skipPreflight = true
            const client = await MangoClient.connect(
              provider,
              CLUSTER,
              MANGO_V4_ID[CLUSTER]
            )

            set((state) => {
              state.mangoAccount.loading = true
            })

            const mangoAccount = await client.getOrCreateMangoAccount(
              group,
              wallet.publicKey,
              0,
              'Account'
            )

            // let orders = await client.getSerum3Orders(
            //   group,
            //   SERUM3_PROGRAM_ID['devnet'],
            //   'BTC/USDC'
            // )

            await mangoAccount.reloadAccountData(client, group)
            set((state) => {
              state.client = client
              state.mangoAccount.current = mangoAccount
              state.mangoAccount.loading = false
              state.connected = true
              // state.serumOrders = orders
            })
            console.log('mango', mangoAccount)
          } catch (e) {
            set((state) => {
              state.mangoAccount.loading = false
            })
            console.error('Error fetching mango acct', e)
          }
        },
        fetchMangoAccounts: async (wallet) => {
          try {
            const set = get().set
            const group = get().group
            const client = get().client
            if (!group) throw new Error('Group not loaded')
            if (!client) throw new Error('Client not loaded')

            const mangoAccounts = await client.getMangoAccountForOwner(
              group,
              wallet.publicKey
            )
            if (mangoAccounts.length) {
              set((state) => {
                state.mangoAccounts = mangoAccounts
              })
            }
          } catch (e) {
            console.error('Error fetching mango accts', e)
          }
        },
        fetchNfts: async (connection: Connection, ownerPk: PublicKey) => {
          const set = get().set
          set((state) => {
            state.wallet.nfts.loading = true
          })
          try {
            const data = await fetchNftsFromHolaplexIndexer(ownerPk)
            // for (const nft of data.nfts) {
            //   const tokenAccount = await getTokenAccountsByMint(
            //     connection,
            //     nft.mintAddress
            //   )
            //   nft.tokenAccount = tokenAccount[0] || null
            // }
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

          fetch(TOKEN_LIST_URL[CLUSTER])
            .then((response) => response.json())
            .then((result) => {
              set((s) => {
                s.jupiterTokens = result
              })
              const inputTokenInfo = result.find((t: any) => t.symbol === 'SOL')
              const outputTokenInfo = result.find(
                (t: any) => t.symbol === 'USDC'
              )
              set((s) => {
                s.swap.inputTokenInfo = inputTokenInfo
                s.swap.outputTokenInfo = outputTokenInfo
              })
            })
        },
        reloadGroup: async () => {
          try {
            const set = get().set
            const client = get().client
            const group = await client.getGroup(DEVNET_GROUP)

            set((state) => {
              state.group = group
            })
          } catch (e) {
            console.error('Error fetching group', e)
          }
        },
        reloadAccount: async () => {
          const set = get().set
          const client = get().client
          const mangoAccount = get().mangoAccount.current
          const group = get().group

          if (!mangoAccount || !group) return

          try {
            const newMangoAccount = await client.getMangoAccount(mangoAccount)
            await newMangoAccount.reloadAccountData(client, group)

            set((state) => {
              state.mangoAccount.current = newMangoAccount
            })
          } catch {
            console.error('Error reloading mango account')
          }
        },
        loadSerumMarket: async () => {
          const set = get().set
          const client = get().client
          const group = get().group
          if (!group) return

          const markets = await client.serum3GetMarkets(
            group,
            group.banksMap.get('BTC')?.tokenIndex,
            group.banksMap.get('USDC')?.tokenIndex
          )

          let orders = await client.getSerum3Orders(group, 'BTC/USDC')

          set((state) => {
            state.markets = markets
            state.serumOrders = orders
          })
        },
        async fetchProfilePicture(wallet: Wallet) {
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
            console.log('Could not get profile picture', e)
            set((state) => {
              state.wallet.loadProfilePic = false
            })
          }
        },
      },
    }
  })
)

export default mangoStore
