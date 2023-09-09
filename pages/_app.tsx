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
  GlowWalletAdapter,
  BackpackWalletAdapter,
  BraveWalletAdapter,
  CoinbaseWalletAdapter,
  MathWalletAdapter,
  Coin98WalletAdapter,
  CloverWalletAdapter,
  LedgerWalletAdapter,
  ExodusWalletAdapter,
  WalletConnectWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { clusterApiUrl } from '@solana/web3.js'
import TransactionNotification from '@components/notifications/TransactionNotification'
import { ThemeProvider } from 'next-themes'
import { appWithTranslation } from 'next-i18next'
import Layout from '../components/Layout'
import MangoProvider from '@components/MangoProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { notify } from 'utils/notifications'
import { useRouter } from 'next/router'
import useSelectedMarket from 'hooks/useSelectedMarket'
import Head from 'next/head'
import useMangoGroup from 'hooks/useMangoGroup'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { getDecimalCount } from 'utils/numbers'
import { AUTO_CONNECT_WALLET, THEME_KEY } from 'utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'

// init react-query
export const queryClient = new QueryClient()

const metaTitle = 'Mango Markets – Safer. Smarter. Faster.'
const metaDescription =
  'A magical new way to interact with DeFi. Groundbreaking safety features designed to keep your funds secure. The easiest way to margin trade any token pair. All powered by flashloans.'

// Do not add hooks to this component, that will cause unnecessary rerenders
// Top level state hydrating/updating should go in MangoProvider
function MyApp({ Component, pageProps }: AppProps) {
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const router = useRouter()
  const wallets = useMemo(() => {
    return [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter(),
      new BraveWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new MathWalletAdapter(),
      new Coin98WalletAdapter(),
      new CloverWalletAdapter(),
      new LedgerWalletAdapter(),
      new ExodusWalletAdapter(),
      new WalletConnectWalletAdapter({ network, options: {} }),
    ]
  }, [network])

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
    } else {
      notify({
        title: `${adapter?.name} ${error.error?.message || 'Error'}`,
        type: 'info',
      })
    }
  }, [])

  const [autoConnectSetting] = useLocalStorageState(AUTO_CONNECT_WALLET, true)
  const autoConnect =
    autoConnectSetting === false || router.asPath.includes('?address')
      ? false
      : true

  return (
    <>
      <Head>
        <title>Mango Markets</title>
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content={metaTitle} />
        <meta name="description" content={metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/apple-touch-icon.png"
        />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta
          name="twitter:image"
          content="https://app.mango.markets/images/1200x600-share.png?34567879"
        />
        <meta name="google" content="notranslate" />
        <link rel="manifest" href="/manifest.json"></link>
      </Head>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider
            wallets={wallets}
            onError={onError}
            autoConnect={autoConnect}
          >
            <MangoProvider />
            <ThemeProvider defaultTheme="Mango Classic" storageKey={THEME_KEY}>
              <PageTitle />
              <Layout>
                <Component {...pageProps} />
              </Layout>
              <TransactionNotification />
            </ThemeProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
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
      const baseBank = group.getFirstBankByTokenIndex(
        selectedMarket.baseTokenIndex,
      )
      const quoteBank = group.getFirstBankByTokenIndex(
        selectedMarket.quoteTokenIndex,
      )
      const market = group.getSerum3ExternalMarket(
        selectedMarket.serumMarketExternal,
      )
      const price = baseBank.uiPrice / quoteBank.uiPrice
      return [market, price]
    }
  }, [selectedMarket, group])

  const marketTitleString =
    market && selectedMarket && router.pathname == '/trade'
      ? `${price?.toFixed(getDecimalCount(market.tickSize))} ${
          selectedMarket.name
        } - Mango`
      : 'Mango Markets'

  return (
    <Head>
      <title>{marketTitleString}</title>
    </Head>
  )
}
