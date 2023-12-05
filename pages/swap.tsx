import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import SwapPage from '../components/swap/SwapPage'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'close-account',
        'common',
        'notifications',
        'onboarding',
        'onboarding-tours',
        'profile',
        'search',
        'settings',
        'swap',
        'trade',
      ])),
    },
  }
}

const Swap: NextPage = () => {
  return (
    <div className="pb-32 md:pb-20 lg:pb-[27px]">
      <SwapPage />
    </div>
  )
}

export default Swap
