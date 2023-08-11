import LeaderboardPage from '@components/leaderboard/LeaderboardPage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'leaderboard',
        'notifications',
        'profile',
        'search',
      ])),
    },
  }
}

const Leaderboard: NextPage = () => {
  return (
    <div className="pb-16 md:pb-[27px]">
      <LeaderboardPage />
    </div>
  )
}

export default Leaderboard
