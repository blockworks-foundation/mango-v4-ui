import SearchPage from '@components/search/SearchPage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
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
        'profile',
        'search',
        'settings',
      ])),
    },
  }
}

const metaTitle = 'Search Accounts | Mango Markets'
const metaDescription =
  'Trading accounts on Mango can be viewed via search. You can view and follow accounts to learn from their trading strategies.'

const Search: NextPage = () => {
  return (
    <>
      <Head>
        <title>Search Accounts | Mango Markets</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta name="og:description" content={metaDescription} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </Head>
      <SearchPage />
    </>
  )
}

export default Search
