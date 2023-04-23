import { SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile'
import { WalletName, WalletReadyState } from '@solana/wallet-adapter-base'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'
import { StandardWalletAdapter } from '@solana/wallet-standard-wallet-adapter-base'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import { notify } from 'utils/notifications'
import useLocalStorageState from 'hooks/useLocalStorageState'

interface EnhancedWalletContextState {
  displayedWallets: Wallet[]
  preselectedWalletName: string
  handleSelect: (name: WalletName | null) => void
  handleConnect: () => Promise<void>
}

const EnhancedWalletContext = createContext<EnhancedWalletContextState>(
  {} as EnhancedWalletContextState
)

export function useEnhancedWallet(): EnhancedWalletContextState {
  return useContext(EnhancedWalletContext)
}

export default function EnhancedWalletProvider({
  children,
}: {
  children: ReactNode
}) {
  const { wallets, select, wallet, connect } = useWallet()

  const displayedWallets = useMemo(
    () =>
      wallets.slice().sort(({ adapter: a }, { adapter: b }) => {
        if (a instanceof SolanaMobileWalletAdapter) {
          if (b instanceof SolanaMobileWalletAdapter) return 0
          return -1
        } else if (b instanceof SolanaMobileWalletAdapter) {
          return 1
        }

        if (a instanceof StandardWalletAdapter) {
          if (b instanceof StandardWalletAdapter) return 0
          return -1
        } else if (b instanceof StandardWalletAdapter) {
          return 1
        }

        if (a.readyState === b.readyState) return 0
        if (a.readyState === WalletReadyState.Installed) return -1
        if (b.readyState === WalletReadyState.Installed) return 1
        return 0
      }),
    [wallets]
  )

  const [preselectedWalletName, setPreselectedWalletName] =
    useLocalStorageState<string>('preselectedWalletName', '')

  useEffect(() => {
    if (wallet) {
      setPreselectedWalletName(wallet.adapter.name)
    } else {
      const hasInstalledWallet = displayedWallets.find(
        (w) => w.readyState === 'Installed'
      )
      if (hasInstalledWallet) {
        setPreselectedWalletName(hasInstalledWallet.adapter.name)
      } else {
        setPreselectedWalletName('Phantom')
      }
    }
  }, [displayedWallets, wallet, setPreselectedWalletName])

  useEffect(() => {
    if (!wallet && preselectedWalletName) {
      const wallet = wallets.find(
        (w) => w.adapter.name === preselectedWalletName
      )
      if (wallet) {
        select(wallet.adapter.name)
      }
    }
  }, [wallet, preselectedWalletName, wallets, select])

  const handleSelect = useCallback(
    (name: WalletName | null) => {
      setPreselectedWalletName(name)
      select(name)
    },
    [setPreselectedWalletName, select]
  )

  const handleConnect = useCallback(async () => {
    if (wallet) {
      try {
        console.log('connecting')
        await connect()
      } catch (e) {
        // Error will be handled by WalletProvider#onError
        select(null)
      }
    } else if (preselectedWalletName) {
      const adapter = wallets.find(
        ({ adapter }) => adapter.name === preselectedWalletName
      )?.adapter

      if (!adapter) {
        setPreselectedWalletName(null)
        return
      }

      if (
        adapter.readyState === WalletReadyState.Installed ||
        adapter.readyState === WalletReadyState.Loadable
      ) {
        await select(adapter.name)
      } else {
        notify({
          title: `${adapter.name} Error`,
          type: 'error',
          description: `Please install ${adapter.name} and then reload this page.`,
        })
        if (typeof window !== 'undefined') {
          window.open(adapter.url, '_blank')
        }
      }
    }
  }, [
    wallets,
    select,
    wallet,
    connect,
    preselectedWalletName,
    setPreselectedWalletName,
  ])

  return (
    <EnhancedWalletContext.Provider
      value={{
        displayedWallets,
        preselectedWalletName,
        handleSelect,
        handleConnect,
      }}
    >
      {children}
    </EnhancedWalletContext.Provider>
  )
}
