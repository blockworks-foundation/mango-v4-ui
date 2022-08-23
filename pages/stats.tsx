import type { NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import TokenStats from '../components/stats/TokenStats'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

const Stats: NextPage = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { pathname, asPath, query } = router

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12">
        <TokenStats />
      </div>
    </div>
  )
}

export default Stats
