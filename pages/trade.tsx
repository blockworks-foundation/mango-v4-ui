import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import TradeSimplePage from '../components/swap/TradeSimplePage'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'trade'])),
    },
  }
}

const Trade: NextPage = () => {
  return <TradeSimplePage />
}

export default Trade
