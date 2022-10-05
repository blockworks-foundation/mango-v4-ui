import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import SwapPage from '../components/swap/SwapPage'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'onboarding-tours',
        'profile',
        'swap',
        'settings',
      ])),
    },
  }
}

const Swap: NextPage = () => {
  return (
    <div className="pb-20 md:pb-16">
      <SwapPage />
    </div>
  )
}

export default Swap
