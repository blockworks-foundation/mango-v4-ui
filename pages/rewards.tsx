import NotWhitelistedPage from '@components/rewards/NotWhitelistedPage'
import RewardsPage from '@components/rewards/RewardsPage'
import mangoStore from '@store/mangoStore'
import { useIsWhiteListed } from 'hooks/useIsWhiteListed'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'

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

const metaTitle = 'Rewards | Be Rewarded for Trading on Mango'
const metaDescription =
  'Earn crypto and NFT rewards every week for trading on Mango. Getting started is easy and all participants earn rewards.'

const Rewards: NextPage = () => {
  const { data: isWhiteListed } = useIsWhiteListed()
  const themeData = mangoStore((s) => s.themeData)
  return (
    <>
      <Head>
        <title>Rewards | Mango Markets</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta name="og:description" content={metaDescription} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </Head>
      <div
        className={`pb-20 md:pb-0 ${themeData.fonts.rewards.variable} font-sans`}
      >
        {isWhiteListed ? <RewardsPage /> : <NotWhitelistedPage />}
      </div>
    </>
  )
}

export default Rewards
