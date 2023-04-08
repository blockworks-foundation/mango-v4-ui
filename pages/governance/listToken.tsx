import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import dynamic from 'next/dynamic'

const ListTokenPage = dynamic(
  () => import('@components/governance/ListToken/ListTokenPage')
)

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'governance',
        'search',
        'common',
        'onboarding',
        'profile',
      ])),
    },
  }
}

const Governance: NextPage = () => {
  return <ListTokenPage />
}

export default Governance
