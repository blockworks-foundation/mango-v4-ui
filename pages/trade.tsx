import TradeAdvancedPage from '@components/trade/TradeAdvancedPage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'onboarding-tours',
        'profile',
        'trade',
      ])),
    },
  }
}

const Trade: NextPage = () => {
  return <TradeAdvancedPage />
}

export default Trade
