import TradeAdvancedPage from '@components/trade/TradeAdvancedPage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'onboarding',
        'onboarding-tours',
        'profile',
        'trade',
      ])),
    },
  }
}

const Trade: NextPage = () => {
  return (
    <div className="pb-16 md:pb-0">
      <TradeAdvancedPage />
    </div>
  )
}

export default Trade
