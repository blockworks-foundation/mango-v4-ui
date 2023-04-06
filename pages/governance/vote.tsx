import VotePage from '@components/governance/vote/VotePage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'governance',
        'search',
        'common',
        'onboarding',
        'profile',
      ])),
    },
  }
}

const ListToken: NextPage = () => {
  return <VotePage />
}

export default ListToken
