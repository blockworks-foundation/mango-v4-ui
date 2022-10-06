import '../styles/globals.css'
import 'react-nice-dates/build/style.css'
import '../styles/datepicker.css'
import type { AppProps } from 'next/app'
import { useMemo } from 'react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider } from '@solana/wallet-adapter-react'
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import Notifications from '../components/shared/Notification'
import { ThemeProvider } from 'next-themes'
import { appWithTranslation } from 'next-i18next'
import Layout from '../components/Layout'
import { ViewportProvider } from '../hooks/useViewport'
import { WalletProvider } from '../components/wallet/WalletProvider'
import MangoProvider from '@components/MangoProvider'

// Do not add hooks to this component that will cause unnecessary rerenders
// Top level state hydrating/updating should go in MangoProvider

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
      <MangoProvider />
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
