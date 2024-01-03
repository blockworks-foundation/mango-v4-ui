import BorrowPage from '@components/borrow/BorrowPage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'borrow',
        'close-account',
        'common',
        'notifications',
        'onboarding',
        'profile',
        'search',
        'settings',
        'swap',
        'token',
        'trade',
      ])),
    },
  }
}

const metaTitle = 'Borrow Crypto on Mango Markets'
const metaDescription =
  'Securely borrow your favorite crypto assets to sell or use in DeFi. Mango makes borrowing easy and secure with multiple collateral options and a robust risk engine.'

const Borrow: NextPage = () => {
  return (
    <>
      <Head>
        <title>Borrow | Mango Markets</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta name="og:description" content={metaDescription} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </Head>
      <div className="pb-20 md:pb-0">
        <BorrowPage />
      </div>
    </>
  )
}

export default Borrow
