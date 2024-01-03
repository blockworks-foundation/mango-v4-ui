import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import AccountPage from '../components/account/AccountPage'
import Head from 'next/head'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'activity',
        'close-account',
        'common',
        'explore',
        'governance',
        'notifications',
        'onboarding',
        'onboarding-tours',
        'profile',
        'search',
        'settings',
        'swap',
        'stats',
        'token',
        'trade',
      ])),
    },
  }
}

const metaTitle = 'Mango Markets | High-Performance Crypto Exchange'
const metaDescription =
  'Margin trade your favorite crypto assets on-chain. Groundbreaking risk management to keep your funds safe. A powerful DEX, powered by Solana.'

const Index: NextPage = () => {
  return (
    <>
      <Head>
        <title>Mango Markets</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta name="og:description" content={metaDescription} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </Head>
      <div className="min-h-[calc(100vh-64px)]">
        <AccountPage />
      </div>
    </>
  )
}

export default Index
