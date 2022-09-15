import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import SwapPage from '../components/swap/SwapPage'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'swap'])),
    },
  }
}

const Swap: NextPage = () => {
  return (
    <div className="p-6 pb-20 md:p-0">
      <SwapPage />
    </div>
  )
}

export default Swap
