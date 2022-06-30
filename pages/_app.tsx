import '../styles/globals.css'
import type { AppProps } from 'next/app'
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

import WalletListener from '../components/wallet/WalletListener'
import { useEffect, useMemo } from 'react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import mangoStore from '../store/state'
import useInterval from '../components/shared/useInterval'

const hydrateStore = async () => {
  const actions = mangoStore.getState().actions
  actions.fetchGroup()
}

const HydrateStore = () => {
  useInterval(() => {
    hydrateStore()
  }, 10000)

  useEffect(() => {
    hydrateStore()
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
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <WalletListener />
            <Component {...pageProps} />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  )
}

export default MyApp
