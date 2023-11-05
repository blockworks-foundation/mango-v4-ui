import { useCallback } from 'react'
import AccountTabs from './AccountTabs'
import HealthContributions from './HealthContributions'
import { NextRouter, useRouter } from 'next/router'
import { useWallet } from '@solana/wallet-adapter-react'
import AccountStats from './AccountStats'
import PerpStatsPage from '@components/stats/perps/PerpStatsPage'
import TokenPage from '@components/token/TokenPage'

export type ViewToShow =
  | ''
  | 'account-stats'
  | 'account-value'
  | 'cumulative-interest-value'
  | 'pnl'
  | 'hourly-funding'
  | 'hourly-volume'
  | 'health-contributions'

export const handleViewChange = (view: ViewToShow, router: NextRouter) => {
  const query = { ...router.query, ['view']: view }
  router.push({ pathname: router.pathname, query }, undefined, {
    shallow: true,
  })
}

const AccountPage = () => {
  const router = useRouter()
  const { market, token, view } = router.query

  return market ? (
    <PerpStatsPage />
  ) : token ? (
    <TokenPage />
  ) : view ? (
    <AccountView view={view as ViewToShow} />
  ) : (
    <AccountTabs />
  )
}

export default AccountPage

const AccountView = ({ view }: { view: ViewToShow }) => {
  const router = useRouter()
  const { connected } = useWallet()
  const { address } = router.query

  const handleHideChart = useCallback(() => {
    if (address && !connected) {
      router.push(`/?address=${address}`, undefined, { shallow: true })
    } else {
      router.push('/', undefined, { shallow: true })
    }
  }, [address, router, connected])

  switch (view) {
    case 'account-stats':
      return <AccountStats hideView={handleHideChart} />
    case 'health-contributions':
      return <HealthContributions hideView={handleHideChart} />
    default:
      return null
  }
}
