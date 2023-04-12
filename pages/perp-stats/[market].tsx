/* eslint-disable @typescript-eslint/no-explicit-any */
import PerpStatsPage from '@components/stats/PerpStatsPage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'profile',
        'search',
        'settings',
        'trade',
      ])),
    },
  }
}

export async function getStaticPaths() {
  return { paths: [], fallback: true }
}

const PerpStats: NextPage = () => {
  return (
    <div className="pb-20 md:pb-16">
      <PerpStatsPage />
    </div>
  )
}

export default PerpStats
