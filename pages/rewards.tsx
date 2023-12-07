import RewardsPage from '@components/rewards/RewardsPage'
import mangoStore from '@store/mangoStore'
import { useIsWhiteListed } from 'hooks/useIsWhiteListed'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

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
        'rewards',
        'search',
        'settings',
      ])),
    },
  }
}

const Rewards: NextPage = () => {
  const { data: isWhiteListed } = useIsWhiteListed()
  const themeData = mangoStore((s) => s.themeData)
  return (
    <div
      className={`pb-20 md:pb-0 ${themeData.fonts.rewards.variable} font-sans`}
    >
      {isWhiteListed ? <RewardsPage /> : null}
    </div>
  )
}

export default Rewards
