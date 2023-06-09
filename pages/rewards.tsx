import RewardsPage from '@components/rewards/RewardsPage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'notifications',
        'onboarding',
        'profile',
        'rewards',
        'search',
      ])),
    },
  }
}

const Rewards: NextPage = () => {
  return (
    <div className="pb-20 md:pb-0">
      <RewardsPage />
    </div>
  )
}

export default Rewards
