import { useEffect } from 'react'
import mangoStore from '@store/mangoStore'
import useInterval from '../components/shared/useInterval'
import { PublicKey } from '@solana/web3.js'
import { useRouter } from 'next/router'
import { MangoAccount } from '@blockworks-foundation/mango-v4'

const rehydrateStore = async () => {
  const actions = mangoStore.getState().actions
  actions.fetchGroup()
  const mangoAccount = mangoStore.getState().mangoAccount.current
  if (mangoAccount) {
    // actions.reloadMangoAccount()
  }
}

const HydrateStore = () => {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  useInterval(() => {
    rehydrateStore()
  }, 5000)

  useEffect(() => {
    const actions = mangoStore.getState().actions
    actions.fetchGroup().then(() => {
      actions.fetchJupiterTokens()
    })
    actions.fetchCoingeckoPrices()
  }, [])

  // watch selected Mango Account for changes
  useEffect(() => {
    const connection = mangoStore.getState().connection
    const client = mangoStore.getState().client

    if (!mangoAccount) return
    console.log('mangoAccount.publicKey', mangoAccount.publicKey.toString())

    const subscriptionId = connection.onAccountChange(
      mangoAccount.publicKey,
      (info, context) => {
        if (info?.lamports === 0) return

        // const lastSeenSlot =
        //   mangoStore.getState().mangoAccount.lastSlot
        // const mangoAccountLastUpdated = new Date(
        //   mangoStore.getState().mangoAccount.lastUpdatedAt
        // )
        const mangoAccount = mangoStore.getState().mangoAccount.current
        if (!mangoAccount) return
        // const newUpdatedAt = new Date()
        // const timeDiff =
        //   mangoAccountLastUpdated.getTime() - newUpdatedAt.getTime()

        // only updated mango account if it's been more than 1 second since last update
        // if (Math.abs(timeDiff) >= 500 && context.slot > lastSeenSlot) {
        const decodedMangoAccount = client.program.coder.accounts.decode(
          'bookSide',
          info?.data
        )
        const newMangoAccount = MangoAccount.from(
          mangoAccount.publicKey,
          decodedMangoAccount
        )
        // newMangoAccount.spotOpenOrdersAccounts =
        //   mangoAccount.spotOpenOrdersAccounts
        // newMangoAccount.advancedOrders = mangoAccount.advancedOrders

        mangoStore((state) => {
          // state.mangoAccount.lastSlot = context.slot
          state.mangoAccount.current = newMangoAccount
          // state.mangoAccount.lastUpdatedAt =
          //   newUpdatedAt.toISOString()
        })
        // }
      }
    )

    return () => {
      connection.removeAccountChangeListener(subscriptionId)
    }
  }, [mangoAccount])

  return null
}

const ReadOnlyMangoAccount = () => {
  const router = useRouter()
  const groupLoaded = mangoStore((s) => s.groupLoaded)
  const ma = router.query?.mangoAccount

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
        await readOnlyMangoAccount.reloadAccountData(client)
        set((state) => {
          state.mangoAccount.current = readOnlyMangoAccount
          state.mangoAccount.initialLoad = false
        })
      } catch (error) {
        console.log('error', error)
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
