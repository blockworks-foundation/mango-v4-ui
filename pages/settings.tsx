import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import SettingsPage from '@components/settings/SettingsPage'

require('dayjs/locale/en')
require('dayjs/locale/es')
require('dayjs/locale/zh')
require('dayjs/locale/zh-tw')

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'onboarding',
        'profile',
        'search',
        'settings',
      ])),
    },
  }
}

const Settings: NextPage = () => {
  return (
    <div className="p-8 pb-20 md:pb-16 lg:p-10">
      <SettingsPage />
    </div>
  )
}

export default Settings
