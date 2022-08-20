import type { AppProps } from 'next/app'
import { useEffect, useMemo } from 'react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider } from '@solana/wallet-adapter-react'
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

import '../styles/globals.css'
import mangoStore from '../store/state'
import useInterval from '../components/shared/useInterval'
import Notifications from '../components/shared/Notification'
import { ThemeProvider } from 'next-themes'
import { appWithTranslation } from 'next-i18next'
import Layout from '../components/Layout'
import { ViewportProvider } from '../hooks/useViewport'
import { WalletProvider } from '../components/wallet/WalletProvider'

const hydrateStore = async () => {
  const actions = mangoStore.getState().actions
  actions.fetchGroup()
}

const HydrateStore = () => {
  useInterval(() => {
    hydrateStore()
  }, 10000)

  useEffect(() => {
    const actions = mangoStore.getState().actions
    actions.fetchGroup().then(() => {
      actions.fetchJupiterTokens()
    })
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
          <ThemeProvider defaultTheme="Dark">
            <ViewportProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </ViewportProvider>
            <Notifications />
          </ThemeProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  )
}

export default appWithTranslation(MyApp)
