import TokenPage from '@components/token/TokenPage'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { LISTED_TOKENS } from 'utils/tokens'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'profile', 'token'])),
    },
  }
}

export const getStaticPaths = async () => {
  const paths = LISTED_TOKENS.map((token) => ({
    params: { token: token },
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
