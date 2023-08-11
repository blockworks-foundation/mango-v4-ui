import BorrowPage from '@components/borrow/BorrowPage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'borrow',
        'common',
        'notifications',
        'onboarding',
        'profile',
        'search',
        'settings',
        'token',
        'trade',
      ])),
    },
  }
}

const Borrow: NextPage = () => {
  return (
    <div className="pb-20 md:pb-0">
      <BorrowPage />
    </div>
  )
}

export default Borrow
