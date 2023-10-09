import ExplorePage from '@components/explore/ExplorePage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'activity',
        'common',
        'explore',
        'governance',
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

const Explore: NextPage = () => {
  return <ExplorePage />
}

export default Explore
