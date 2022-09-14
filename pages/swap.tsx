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
  return (
    <div className="p-8 pb-20 md:p-12">
      <TradeSimplePage />
    </div>
  )
}

export default Trade
