import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import dynamic from 'next/dynamic'

const ListMarketOrTokenPage = dynamic(
  () => import('@components/governance/ListMarketOrTokenPage'),
)

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'close-account',
        'common',
        'governance',
        'notifications',
        'onboarding',
        'profile',
        'search',
        'settings',
        'trade',
      ])),
    },
  }
}

const Governance: NextPage = () => {
  return <ListMarketOrTokenPage />
}

export default Governance
