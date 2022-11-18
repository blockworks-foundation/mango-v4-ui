import { useEffect } from 'react'
import mangoStore from '@store/mangoStore'
import useInterval from '@components/shared/useInterval'
import { PublicKey } from '@solana/web3.js'
import { useRouter } from 'next/router'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import useMangoAccount from 'hooks/useMangoAccount'

const rehydrateStore = async () => {
  const actions = mangoStore.getState().actions
  actions.fetchGroup()
  const mangoAccount = mangoStore.getState().mangoAccount.current
  if (mangoAccount) {
    // actions.reloadMangoAccount()
  }
}

const HydrateStore = () => {
  const actions = mangoStore((s) => s.actions)
  const { mangoAccount } = useMangoAccount()
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)

  useInterval(() => {
    rehydrateStore()
  }, 5000)

  useEffect(() => {
    const fetchData = async () => {
      await actions.fetchGroup()
      actions.fetchJupiterTokens()
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (jupiterTokens.length) {
      actions.fetchCoingeckoPrices()
    }
  }, [jupiterTokens])

  // watch selected Mango Account for changes
  useEffect(() => {
    const connection = mangoStore.getState().connection
    const client = mangoStore.getState().client

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
          mangoStore.setState({
            mangoAccount: {
              ...mangoStore.getState().mangoAccount,
              current: newMangoAccount,
              lastSlot: context.slot,
            },
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
