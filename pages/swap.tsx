import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import SwapPage from '../components/swap/SwapPage'
import Head from 'next/head'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'close-account',
        'common',
        'notifications',
        'onboarding',
        'onboarding-tours',
        'profile',
        'search',
        'settings',
        'swap',
        'trade',
      ])),
    },
  }
}

const metaTitle = 'Margin Swap | Swap x Leverage x Flashloans'
const metaDescription =
  'The best swaps in crypto. Margin trade and token pair, set trigger orders and utilize all the liquidity on Solana.'

const Swap: NextPage = () => {
  return (
    <>
      <Head>
        <title>Margin Swap | Mango Markets</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta name="og:description" content={metaDescription} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </Head>
      <SwapPage />
    </>
  )
}

export default Swap
