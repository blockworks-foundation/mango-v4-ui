import '../styles/globals.css'
import 'react-nice-dates/build/style.css'
import '../styles/datepicker.css'
import type { AppProps } from 'next/app'
import { useCallback, useMemo } from 'react'
import {
  Adapter,
  WalletAdapterNetwork,
  WalletError,
  WalletNotReadyError,
} from '@solana/wallet-adapter-base'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  GlowWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import Notifications from '../components/shared/Notification'
import { ThemeProvider } from 'next-themes'
import { appWithTranslation } from 'next-i18next'
import Layout from '../components/Layout'
import { ViewportProvider } from '../hooks/useViewport'
import MangoProvider from '@components/MangoProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EnhancedWalletProvider from '@components/wallet/EnhancedWalletProvider'
import { notify } from 'utils/notifications'
import { useRouter } from 'next/router'
import useSelectedMarket from 'hooks/useSelectedMarket'
import Head from 'next/head'
import useMangoGroup from 'hooks/useMangoGroup'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { getDecimalCount } from 'utils/numbers'
import {
  EthereumClient,
  modalConnectors,
  walletConnectProvider,
} from '@web3modal/ethereum'
import { THEME_KEY } from 'utils/constants'

import { Web3Modal } from '@web3modal/react'
import { configureChains, createClient, WagmiConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
// Do not add hooks to this component that will cause unnecessary rerenders
// Top level state hydrating/updating should go in MangoProvider

// Create a client
const queryClient = new QueryClient()
const chains = [mainnet]
const walletConnectProjectId = process.env.ETH_WALLET_CONNECT_PROJECT_ID || ''

// Wagmi client
const { provider } = configureChains(chains, [
  walletConnectProvider({ projectId: walletConnectProjectId }),
])
const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({ appName: 'web3Modal', chains }),
  provider,
})

// Web3Modal Ethereum Client
const ethereumClient = new EthereumClient(wagmiClient, chains)

function MyApp({ Component, pageProps }: AppProps) {
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new GlowWalletAdapter(),
    ],
    []
  )

  const onError = useCallback((error: WalletError, adapter?: Adapter) => {
    console.error(error, adapter)
    if (error instanceof WalletNotReadyError && adapter) {
      notify({
        title: `${adapter.name} Error`,
        type: 'error',
        description: `Please install ${adapter.name} and then reload this page.`,
      })
      if (typeof window !== 'undefined') {
        window.open(adapter.url, '_blank')
      }
    }
  }, [])

  return (
    <>
      <Head>
        <title>Mango Markets</title>
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="Mango Markets" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="keywords"
          content="Mango Markets, Serum, SRM, Serum DEX, DEFI, Decentralized Finance, Decentralised Finance, Crypto, ERC20, Ethereum, Decentralize, Solana, SOL, SPL, Cross-Chain, Trading, Fastest, Fast, SerumBTC, SerumUSD, SRM Tokens, SPL Tokens"
        />
        <meta
          name="description"
          content="Mango Markets - Decentralised, cross-margin trading up to 10x leverage with lightning speed and near-zero fees."
        />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/apple-touch-icon.png"
        />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mango Markets" />
        <meta
          name="twitter:description"
          content="Mango Markets - Decentralised, cross-margin trading up to 10x leverage with lightning speed and near-zero fees."
        />
        <meta
          name="twitter:image"
          content="https://www.mango.markets/socials/twitter-image-1200x600.png?34567878"
        />
        <meta name="google" content="notranslate" />
        <link rel="manifest" href="/manifest.json"></link>
      </Head>
      <MangoProvider />
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} onError={onError}>
            <WagmiConfig client={wagmiClient}>
              <EnhancedWalletProvider>
                <ThemeProvider
                  defaultTheme="Mango Classic"
                  storageKey={THEME_KEY}
                >
                  <ViewportProvider>
                    <PageTitle />
                    <Layout>
                      <Component {...pageProps} />
                    </Layout>
                  </ViewportProvider>
                  <Notifications />
                </ThemeProvider>
              </EnhancedWalletProvider>
            </WagmiConfig>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
      <Web3Modal
        projectId={walletConnectProjectId}
        ethereumClient={ethereumClient}
      />
    </>
  )
}

export default appWithTranslation(MyApp)

const PageTitle = () => {
  const router = useRouter()
  const { selectedMarket } = useSelectedMarket()
  const { group } = useMangoGroup()

  const [market, price] = useMemo(() => {
    if (!selectedMarket || !group) return []
    if (selectedMarket instanceof PerpMarket) {
      return [selectedMarket, selectedMarket.uiPrice]
    } else {
      const price = group.getFirstBankByTokenIndex(
        selectedMarket.baseTokenIndex
      ).uiPrice
      const market = group.getSerum3ExternalMarket(
        selectedMarket.serumMarketExternal
      )
      return [market, price]
    }
  }, [selectedMarket, group])

  const marketTitleString =
    market && selectedMarket && router.pathname == '/trade'
      ? `${price?.toFixed(getDecimalCount(market.tickSize))} ${
          selectedMarket.name
        } - `
      : ''

  return (
    <Head>
      <title>{marketTitleString}Mango Markets</title>
    </Head>
  )
}
