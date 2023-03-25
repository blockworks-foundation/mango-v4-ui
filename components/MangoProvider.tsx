import { useEffect } from 'react'
import mangoStore from '@store/mangoStore'
import { Keypair, PublicKey } from '@solana/web3.js'
import { useRouter } from 'next/router'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import useMangoAccount from 'hooks/useMangoAccount'
import useInterval from './shared/useInterval'

const set = mangoStore.getState().set
const actions = mangoStore.getState().actions

const HydrateStore = () => {
  const router = useRouter()
  const { name: marketName } = router.query
  const { mangoAccountPk, mangoAccountAddress } = useMangoAccount()
  const connection = mangoStore((s) => s.connection)

  useEffect(() => {
    if (marketName && typeof marketName === 'string') {
      set((s) => {
        s.selectedMarket.name = marketName
      })
    }
    actions.fetchGroup()
  }, [marketName])

  useInterval(() => {
    actions.fetchGroup()
  }, 25000)

  // refetches open orders every 30 seconds
  // only the selected market's open orders are updated via websocket
  useInterval(() => {
    if (mangoAccountAddress) {
      actions.fetchOpenOrders()
    }
  }, 30000)

  // refetch trade history and activity feed when switching accounts
  useEffect(() => {
    const actions = mangoStore.getState().actions
    if (mangoAccountAddress) {
      actions.fetchTradeHistory()
      actions.fetchActivityFeed(mangoAccountAddress)
    }
  }, [mangoAccountAddress])

  // reload and parse market fills from the event queue
  useInterval(async () => {
    const actions = mangoStore.getState().actions
    actions.loadMarketFills()
  }, 6000)

  // The websocket library solana/web3.js uses closes its websocket connection when the subscription list
  // is empty after opening its first time, preventing subsequent subscriptions from receiving responses.
  // This is a hack to prevent the list from every getting empty
  useEffect(() => {
    const id = connection.onAccountChange(new Keypair().publicKey, () => {
      return
    })
    return () => {
      connection.removeAccountChangeListener(id)
    }
  }, [connection])

  // watch selected Mango Account for changes
  useEffect(() => {
    const client = mangoStore.getState().client
    if (!mangoAccountPk) return
    const subscriptionId = connection.onAccountChange(
      mangoAccountPk,
      async (info, context) => {
        if (info?.lamports === 0) return

        const lastSeenSlot = mangoStore.getState().mangoAccount.lastSlot
        const mangoAccount = mangoStore.getState().mangoAccount.current
        if (!mangoAccount) return

        if (context.slot > lastSeenSlot) {
          const decodedMangoAccount = client.program.coder.accounts.decode(
            'mangoAccount',
            info?.data
          )
          const newMangoAccount = MangoAccount.from(
            mangoAccount.publicKey,
            decodedMangoAccount
          )
          if (newMangoAccount.serum3Active().length > 0) {
            await newMangoAccount.reloadSerum3OpenOrders(client)
          }
          set((s) => {
            s.mangoAccount.current = newMangoAccount
            s.mangoAccount.lastSlot = context.slot
          })
          actions.fetchOpenOrders()
        }
      }
    )

    return () => {
      connection.removeAccountChangeListener(subscriptionId)
    }
  }, [connection, mangoAccountPk])

  return null
}

const ReadOnlyMangoAccount = () => {
  const router = useRouter()
  const groupLoaded = mangoStore((s) => s.groupLoaded)
  const ma = router.query?.address

  useEffect(() => {
    if (!groupLoaded) return
    const set = mangoStore.getState().set
    const group = mangoStore.getState().group

    async function loadUnownedMangoAccount() {
      try {
        if (!ma || !group) return

        const client = mangoStore.getState().client
        const pk = new PublicKey(ma)
        const readOnlyMangoAccount = await client.getMangoAccount(pk)
        await readOnlyMangoAccount.reloadSerum3OpenOrders(client)
        set((state) => {
          state.mangoAccount.current = readOnlyMangoAccount
          state.mangoAccount.initialLoad = false
        })
        await actions.fetchOpenOrders()
        actions.fetchTradeHistory()
      } catch (error) {
        console.error('error', error)
      }
    }

    if (ma) {
      set((state) => {
        state.mangoAccount.initialLoad = true
      })
      loadUnownedMangoAccount()
    }
  }, [ma, groupLoaded, router])

  return null
}

const MangoProvider = () => {
  return (
    <>
      <HydrateStore />
      <ReadOnlyMangoAccount />
    </>
  )
}

export default MangoProvider
