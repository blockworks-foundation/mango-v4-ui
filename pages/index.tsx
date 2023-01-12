import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import AccountPage from '../components/account/AccountPage'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'onboarding',
        'onboarding-tours',
        'profile',
        'settings',
        'swap',
        'trade',
        'activity',
        'close-account'
      ])),
    },
  }
}

const Index: NextPage = () => {
  return (
    <div className="pb-20 md:pb-16">
      <AccountPage />
    </div>
  )
}

export default Index
