import { useCallback, useEffect } from 'react'
import mangoStore from '@store/mangoStore'
import { Keypair, PublicKey } from '@solana/web3.js'
import { useRouter } from 'next/router'
import useMangoAccount from 'hooks/useMangoAccount'
import useInterval from './shared/useInterval'
import { LAST_WALLET_NAME, PRIORITY_FEE_KEY, SECONDS } from 'utils/constants'
import useNetworkSpeed from 'hooks/useNetworkSpeed'
import { useWallet } from '@solana/wallet-adapter-react'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { DEFAULT_PRIORITY_FEE_LEVEL } from './settings/RpcSettings'
import { useHiddenMangoAccounts } from 'hooks/useHiddenMangoAccounts'
import { notify } from 'utils/notifications'
import { usePlausible } from 'next-plausible'
import { TelemetryEvents } from 'utils/telemetry'

const set = mangoStore.getState().set
const actions = mangoStore.getState().actions

const HydrateStore = () => {
  const router = useRouter()
  const { name: marketName } = router.query
  const { mangoAccountPk, mangoAccountAddress } = useMangoAccount()
  const connection = mangoStore((s) => s.connection)
  const slowNetwork = useNetworkSpeed()
  const { wallet } = useWallet()
  const telemetry = usePlausible<TelemetryEvents>()

  const [, setLastWalletName] = useLocalStorageState(LAST_WALLET_NAME, '')

  // Handle scroll restoration when the route changes
  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0)
      }
    }

    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [])

  const handleWindowResize = useCallback(() => {
    if (typeof window !== 'undefined') {
      set((s) => {
        s.window.width = window.innerWidth
        s.window.height = window.innerHeight
      })
    }
  }, [])
  // store the window width and height on resize
  useEffect(() => {
    handleWindowResize()
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleWindowResize])

  useEffect(() => {
    if (wallet?.adapter) {
      setLastWalletName(wallet?.adapter.name)
    }
  }, [wallet, setLastWalletName])

  useEffect(() => {
    if (marketName && typeof marketName === 'string') {
      set((s) => {
        s.selectedMarket.name = marketName
      })
    }
    actions.fetchGroup()
  }, [marketName])

  useInterval(
    () => {
      actions.fetchGroup()
    },
    (slowNetwork ? 60 : 30) * SECONDS,
  )

  // refetches open orders every 30 seconds
  // only the selected market's open orders are updated via websocket
  useInterval(
    () => {
      if (mangoAccountAddress) {
        actions.fetchOpenOrders()
      }
    },
    (slowNetwork ? 60 : 30) * SECONDS,
  )

  // refetch trade history and activity feed when switching accounts
  useEffect(() => {
    const actions = mangoStore.getState().actions
    if (mangoAccountAddress) {
      actions.fetchActivityFeed(mangoAccountAddress)
    }
  }, [mangoAccountAddress])

  // reload and parse market fills from the event queue
  useInterval(
    async () => {
      const actions = mangoStore.getState().actions
      actions.loadMarketFills()
    },
    (slowNetwork ? 60 : 20) * SECONDS,
  )

  // estimate the priority fee every 30 seconds
  useInterval(
    async () => {
      if (mangoAccountAddress) {
        const priorityFeeMultiplier = Number(
          localStorage.getItem(PRIORITY_FEE_KEY) ??
            DEFAULT_PRIORITY_FEE_LEVEL.value,
        )
        actions.estimatePriorityFee(priorityFeeMultiplier, telemetry)
      }
    },
    (slowNetwork ? 60 : 10) * SECONDS,
  )

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

        const mangoAccount = mangoStore.getState().mangoAccount.current
        if (!mangoAccount) return
        const newMangoAccount = client.getMangoAccountFromAi(
          mangoAccount.publicKey,
          info,
        )
        // don't fetch serum3OpenOrders if the slot is old
        if (context.slot > mangoStore.getState().mangoAccount.lastSlot) {
          if (newMangoAccount.serum3Active().length > 0) {
            await newMangoAccount.reloadSerum3OpenOrders(client)
            // check again that the slot is still the most recent after the reloading open orders
            if (context.slot > mangoStore.getState().mangoAccount.lastSlot) {
              set((s) => {
                s.mangoAccount.current = newMangoAccount
                s.mangoAccount.lastSlot = context.slot
              })
            }
          }
          actions.fetchOpenOrders()
        }
      },
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
  const { hiddenAccounts } = useHiddenMangoAccounts()

  useEffect(() => {
    if (!groupLoaded) return
    const set = mangoStore.getState().set
    const group = mangoStore.getState().group

    if (hiddenAccounts?.includes(ma as string)) {
      notify({
        title: 'Private Account mode enabled',
        type: 'info',
      })
      return
    }

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
      } catch (error) {
        console.error('error', error)
        notify({
          title: 'No account found',
          description: 'Account closed or invalid address',
          type: 'error',
        })
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
