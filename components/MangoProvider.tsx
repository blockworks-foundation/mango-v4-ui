import { useEffect } from 'react'
import mangoStore from '@store/mangoStore'
import useInterval from '../components/shared/useInterval'
import { PublicKey } from '@solana/web3.js'
import { useRouter } from 'next/router'

const rehydrateStore = async () => {
  const actions = mangoStore.getState().actions
  actions.fetchGroup()
  const mangoAccount = mangoStore.getState().mangoAccount.current
  if (mangoAccount) {
    // actions.reloadMangoAccount()
  }
}

const HydrateStore = () => {
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

  return null
}

const ReadOnlyMangoAccount = () => {
  const router = useRouter()
  const groupLoaded = mangoStore((s) => s.groupLoaded)
  const { ma } = router.query

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
        // set((state) => {
        //   state.mangoAccount.current = readOnlyMangoAccount
        //   state.mangoAccount.initialLoad = false
        // })
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
