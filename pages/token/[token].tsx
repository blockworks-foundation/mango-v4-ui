import TokenPage from '@components/token/TokenPage'
import { CLUSTER } from '@store/mangoStore'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'profile',
        'settings',
        'token',
      ])),
    },
  }
}

export const getStaticPaths = async () => {
  const url =
    CLUSTER === 'devnet'
      ? 'https://api.jup.ag/api/tokens/devnet'
      : 'https://cache.jup.ag/tokens'
  const response = await fetch(url)
  const data = await response.json()
  const paths = data.map((t: any) => ({
    params: { token: t.symbol },
  }))

  return { paths, fallback: false }
}

const Token: NextPage = () => {
  return (
    <div className="pb-20 md:pb-16">
      <TokenPage />
    </div>
  )
}

export default Token
