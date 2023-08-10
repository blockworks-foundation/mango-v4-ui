import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import SwapPage from '../components/swap/SwapPage'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'common',
        'notifications',
        'onboarding',
        'onboarding-tours',
        'profile',
        'search',
        'settings',
        'swap',
        'settings',
        'trade',
        'close-account',
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
