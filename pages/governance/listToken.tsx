import ListTokenPage from '@components/governance/ListToken/ListTokenPage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'governance',
        'search',
        'common',
      ])),
    },
  }
}

const ListToken: NextPage = () => {
  return <ListTokenPage />
}

export default ListToken
