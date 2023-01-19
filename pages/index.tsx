import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import AccountPage from '../components/account/AccountPage'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'activity',
        'common',
        'onboarding',
        'onboarding-tours',
        'profile',
        'search',
        'settings',
        'swap',
        'token',
        'trade',
        'close-account'
      ])),
    },
  }
}

const Index: NextPage = () => {
  return (
    <div className="pb-20 md:pb-0">
      <AccountPage />
    </div>
  )
}

export default Index
