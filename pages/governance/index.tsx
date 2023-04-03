import GovernancePage from '@components/governance/GovernancePage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'governance',
        'search',
        'common',
        'onboarding',
      ])),
    },
  }
}

const Governance: NextPage = () => {
  return <GovernancePage />
}

export default Governance
