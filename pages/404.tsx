import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { RektIcon } from '@components/icons/RektIcon'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'close-account',
        'common',
        'notifications',
        'onboarding',
        'profile',
        'search',
        'settings',
      ])),
      // Will be passed to the page component as props
    },
  }
}

export default function Custom404() {
  const { t } = useTranslation('common')
  return (
    <div
      className="mx-auto flex max-w-xl flex-col items-center justify-center text-center"
      style={{ height: 'calc(100vh - 80px)' }}
    >
      <RektIcon className="mb-4 h-14 w-auto -rotate-6 transform text-th-down" />
      <h1 className="mt-1 text-3xl text-th-fgd-1 sm:text-4xl">
        404: {t('404-heading')}
      </h1>
      <p className="mt-2 text-lg">{t('404-description')}</p>
    </div>
  )
}
