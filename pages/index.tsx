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
        'notifications',
        'onboarding',
        'onboarding-tours',
        'profile',
        'search',
        'settings',
        'swap',
        'stats',
        'token',
        'trade',
        'close-account',
      ])),
    },
  }
}

const Index: NextPage = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] pb-32 md:pb-20 lg:pb-[27px]">
      <AccountPage />
    </div>
  )
}

export default Index
