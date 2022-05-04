import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import produce from 'immer'
import { Provider, Wallet } from '@project-serum/anchor'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import {
  MangoClient,
  DEVNET_GROUP,
  Group,
  MangoAccount,
  Serum3Market,
  DEVNET_SERUM3_PROGRAM_ID,
} from '@blockworks-foundation/mango-v4'
import EmptyWallet from '../utils/wallet'
import { Order } from '@blockworks-foundation/mango-v4/node_modules/@project-serum/serum/lib/market'

const connection = new Connection('https://api.devnet.solana.com', 'processed')
const options = Provider.defaultOptions() // use Provider instead of Provider
const provider = new Provider(
  connection,
  new EmptyWallet(Keypair.generate()),
  options
)

export type MangoStore = {
  connected: boolean
  group: Group | undefined
  client: MangoClient
  mangoAccount: MangoAccount | undefined
  markets: Serum3Market[] | undefined
  serumOrders: Order[] | undefined
  set: (x: (x: MangoStore) => void) => void
  actions: {
    fetchGroup: () => Promise<void>
    connectWallet: (wallet: Wallet) => Promise<void>
    reloadAccount: () => Promise<void>
    loadSerumMarket: () => Promise<void>
  }
}

const mangoStore = create<MangoStore>(
  subscribeWithSelector((set, get) => {
    return {
      connected: false,
      group: undefined,
      client: MangoClient.connect(provider, true),
      mangoAccount: undefined,
      markets: undefined,
      serumOrders: undefined,
      set: (fn) => set(produce(fn)),
      actions: {
        fetchGroup: async () => {
          try {
            const client = get().client
            const group = await client.getGroup(new PublicKey(DEVNET_GROUP))
            const markets = await client.serum3GetMarket(
              group,
              group.banksMap.get('BTC')?.tokenIndex,
              group.banksMap.get('USDC')?.tokenIndex
            )

            set((state) => {
              state.connected = true
              state.group = group
              state.markets = markets
            })
          } catch (e) {
            console.error('Error fetching group', e)
          }
        },
        connectWallet: async (wallet) => {
          try {
            const group = get().group
            if (!group) return

            const provider = new Provider(connection, wallet, options)
            const client = await MangoClient.connect(provider, true)

            const mangoAccount = await client.getOrCreateMangoAccount(
              group,
              wallet.publicKey,
              0,
              'Account'
            )

            let orders = await client.getSerum3Orders(
              group,
              DEVNET_SERUM3_PROGRAM_ID,
              'BTC/USDC'
            )

            set((state) => {
              state.client = client
              state.mangoAccount = mangoAccount
              state.serumOrders = orders
            })
          } catch (e) {
            console.error('Error fetching mango acct', e)
          }
        },
        reloadAccount: async () => {
          const client = get().client
          const mangoAccount = get().mangoAccount

          if (!mangoAccount) return

          try {
            const newMangoAccount = await client.getMangoAccount(mangoAccount)

            set((state) => {
              state.mangoAccount = newMangoAccount
            })
          } catch {
            console.error('Error reloading mango account')
          }
        },
        loadSerumMarket: async () => {
          const client = get().client
          const group = get().group
          if (!group) return

          const markets = await client.serum3GetMarket(
            group,
            group.banksMap.get('BTC')?.tokenIndex,
            group.banksMap.get('USDC')?.tokenIndex
          )

          let orders = await client.getSerum3Orders(
            group,
            DEVNET_SERUM3_PROGRAM_ID,
            'BTC/USDC'
          )

          set((state) => {
            state.markets = markets
            state.serumOrders = orders
          })
        },
      },
    }
  })
)

export default mangoStore
