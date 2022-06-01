import { useEffect, useMemo } from 'react'
import type { NextPage } from 'next'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'

import Home from '../components/Home'
import mangoStore from '../store/state'
import TopBar from '../components/TopBar'
import WalletListener from '../components/wallet/WalletListener'
import useInterval from '../components/shared/useInterval'

const hydrateStore = async () => {
  const actions = mangoStore.getState().actions
  actions.fetchGroup()
}

const Index: NextPage = () => {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  useInterval(() => {
    const actions = mangoStore.getState().actions
    actions.reloadGroup()
  }, 10000)

  useEffect(() => {
    hydrateStore()
  }, [])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  )

  return (
    <div className="">
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <WalletListener />
            <TopBar />

            <Home />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  )
}

export default Index
