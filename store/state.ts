import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import produce from 'immer'
import { AnchorProvider, Wallet } from '@project-serum/anchor'
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

const DEVNET_GROUP = new PublicKey(
  'A9XhGqUUjV992cD36qWDY8wDiZnGuCaUWtSE3NGXjDCb'
)

export const connection = new Connection(
  'https://mango.rpcpool.com/946ef7337da3f5b8d3e4a34e7f88',
  'processed'
)
const options = AnchorProvider.defaultOptions() // use Provider instead of Provider
const provider = new AnchorProvider(
  connection,
  new EmptyWallet(Keypair.generate()),
  options
)

export type MangoStore = {
  connection: Connection
  group: Group | undefined
  client: MangoClient
  mangoAccount: MangoAccount | undefined
  markets: Serum3Market[] | undefined
  serumOrders: Order[] | undefined
  set: (x: (x: MangoStore) => void) => void
  actions: {
    fetchGroup: () => Promise<void>
    fetchMangoAccount: (wallet: Wallet) => Promise<void>
    loadSerumMarket: () => Promise<void>
    reloadAccount: () => Promise<void>
    reloadGroup: () => Promise<void>
  }
}

const mangoStore = create<MangoStore>(
  subscribeWithSelector((set, get) => {
    return {
      connection,
      group: undefined,
      client: MangoClient.connect(
        provider,
        'mainnet-beta',
        MANGO_V4_ID['mainnet-beta']
      ),
      mangoAccount: undefined,
      markets: undefined,
      serumOrders: undefined,
      set: (fn) => set(produce(fn)),
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
            console.log('connecting wallet', wallet.publicKey.toString())
            const set = get().set
            const group = get().group
            if (!group) throw new Error('Group not loaded')

            const provider = new AnchorProvider(connection, wallet, options)
            const client = await MangoClient.connect(
              provider,
              'mainnet-beta',
              MANGO_V4_ID['mainnet-beta']
            )

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

            set((state) => {
              state.client = client
              state.mangoAccount = mangoAccount
              // state.serumOrders = orders
            })
          } catch (e) {
            console.error('Error fetching mango acct', e)
          }
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
      },
    }
  })
)

export default mangoStore
