import { useEffect, useMemo, useState } from 'react'
import mangoStore from '@store/mangoStore'
import TabButtons from '../shared/TabButtons'
import TokenList from '../TokenList'
import SwapHistoryTable from '../swap/SwapHistoryTable'
import ActivityFeed from './ActivityFeed'
import UnsettledTrades from '@components/trade/UnsettledTrades'
import { useUnsettledSpotBalances } from 'hooks/useUnsettledSpotBalances'

const TABS = [
  'balances',
  'activity:activity',
  'swap:swap-history',
  'trade:unsettled',
]

const AccountTabs = () => {
  const [activeTab, setActiveTab] = useState('balances')
  const actions = mangoStore((s) => s.actions)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  const tabsWithCount: [string, number][] = useMemo(() => {
    return TABS.map((t) => [t, 0])
  }, [])

  useEffect(() => {
    if (mangoAccount) {
      actions.fetchSwapHistory(mangoAccount.publicKey.toString())
    }
  }, [actions, mangoAccount])

  return (
    <>
      <TabButtons
        activeValue={activeTab}
        onChange={(v) => setActiveTab(v)}
        values={tabsWithCount}
        showBorders
      />
      <TabContent activeTab={activeTab} />
    </>
  )
}

const TabContent = ({ activeTab }: { activeTab: string }) => {
  const swapHistory = mangoStore((s) => s.mangoAccount.stats.swapHistory.data)
  const loading = mangoStore((s) => s.mangoAccount.stats.swapHistory.loading)
  const unsettledSpotBalances = useUnsettledSpotBalances()
  switch (activeTab) {
    case 'balances':
      return <TokenList />
    case 'activity:activity':
      return <ActivityFeed />
    case 'swap:swap-history':
      return <SwapHistoryTable swapHistory={swapHistory} loading={loading} />
    case 'trade:unsettled':
      return <UnsettledTrades unsettledSpotBalances={unsettledSpotBalances} />
    default:
      return <TokenList />
  }
}

export default AccountTabs
