import StatsPage from '@components/stats/StatsPage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'activity',
        'common',
        'notifications',
        'onboarding',
        'profile',
        'search',
        'settings',
        'stats',
        'token',
        'trade',
      ])),
    },
  }
}

const Stats: NextPage = () => {
  return <StatsPage />
}

export default Stats
