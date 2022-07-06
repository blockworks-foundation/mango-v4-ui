import type { AppProps } from 'next/app'
import { useEffect, useMemo } from 'react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

import '../styles/globals.css'
import WalletListener from '../components/wallet/WalletListener'
import mangoStore, { CLUSTER } from '../store/state'
import useInterval from '../components/shared/useInterval'
import Notifications from '../components/shared/Notification'
import { ThemeProvider } from 'next-themes'
import { TOKEN_LIST_URL } from '@jup-ag/core'

const hydrateStore = async () => {
  const actions = mangoStore.getState().actions
  actions.fetchGroup()
}

const loadJupTokens = async () => {
  const set = mangoStore.getState().set

  fetch(TOKEN_LIST_URL[CLUSTER])
    .then((response) => response.json())
    .then((result) => {
      set((s) => {
        s.jupiterTokens = result
      })
    })
}

const HydrateStore = () => {
  useInterval(() => {
    hydrateStore()
  }, 10000)

  useEffect(() => {
    hydrateStore()
    loadJupTokens()
  }, [])

  return null
}

function MyApp({ Component, pageProps }: AppProps) {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  )

  return (
    <>
      <HydrateStore />
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets}>
          <WalletModalProvider>
            <WalletListener />
            <ThemeProvider defaultTheme="Mango">
              <Component {...pageProps} />
              <Notifications />
            </ThemeProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  )
}

export default MyApp
