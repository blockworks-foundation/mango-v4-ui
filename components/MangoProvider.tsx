import { useCallback, useEffect } from 'react'
import mangoStore from '@store/mangoStore'
import { PublicKey } from '@solana/web3.js'
import { useRouter } from 'next/router'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import useMangoAccount from 'hooks/useMangoAccount'
import useInterval from './shared/useInterval'

const HydrateStore = () => {
  const router = useRouter()
  const { name: marketName } = router.query
  const { mangoAccount } = useMangoAccount()

  const fetchData = useCallback(async () => {
    const actions = mangoStore.getState().actions
    await actions.fetchGroup()
  }, [])

  useEffect(() => {
    const set = mangoStore.getState().set
    if (marketName && typeof marketName === 'string') {
      set((s) => {
        s.selectedMarket.name = marketName
      })
    }
    fetchData()
  }, [marketName])

  useInterval(() => {
    fetchData()
  }, 15000)

  // watch selected Mango Account for changes
  useEffect(() => {
    const connection = mangoStore.getState().connection
    const client = mangoStore.getState().client
    const set = mangoStore.getState().set

    if (!mangoAccount) return

    const subscriptionId = connection.onAccountChange(
      mangoAccount.publicKey,
      async (info, context) => {
        if (info?.lamports === 0) return

        const lastSeenSlot = mangoStore.getState().mangoAccount.lastSlot
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
        if (context.slot > lastSeenSlot) {
          const decodedMangoAccount = client.program.coder.accounts.decode(
            'mangoAccount',
            info?.data
          )
          const newMangoAccount = MangoAccount.from(
            mangoAccount.publicKey,
            decodedMangoAccount
          )
          await newMangoAccount.reloadAccountData(client)

          // newMangoAccount.spotOpenOrdersAccounts =
          //   mangoAccount.spotOpenOrdersAccounts
          // newMangoAccount.advancedOrders = mangoAccount.advancedOrders
          set((s) => {
            s.mangoAccount.current = newMangoAccount
            s.mangoAccount.lastSlot = context.slot
          })
        }
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
        await readOnlyMangoAccount.reloadAccountData(client)
        set((state) => {
          state.mangoAccount.current = readOnlyMangoAccount
          state.mangoAccount.initialLoad = false
        })
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
