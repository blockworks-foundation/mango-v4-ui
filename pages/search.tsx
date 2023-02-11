import SearchPage from '@components/search/SearchPage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'profile',
        'search',
      ])),
    },
  }
}

const Search: NextPage = () => {
  return <SearchPage />
}

export default Search
