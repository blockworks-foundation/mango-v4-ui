import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import dynamic from 'next/dynamic'

const VotePage = dynamic(() => import('@components/governance/Vote/VotePage'))

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
