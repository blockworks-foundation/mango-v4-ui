import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import AccountPage from '../components/account/AccountPage'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'close-account',
        'swap',
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
