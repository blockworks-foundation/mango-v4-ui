import { useEffect, useState } from 'react'
import mangoStore from '@store/mangoStore'
import TabButtons from '../shared/TabButtons'
import TokenList from '../TokenList'
import SwapHistoryTable from '../swap/SwapHistoryTable'
import { useRouter } from 'next/router'
import ActivityFeed from './ActivityFeed'

const AccountTabs = () => {
  const [activeTab, setActiveTab] = useState('balances')
  const actions = mangoStore((s) => s.actions)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const { pathname } = useRouter()

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
        values={['balances', 'activity:activity', 'swap:swap-history']}
        showBorders
      />
      <TabContent activeTab={activeTab} />
    </>
  )
}

const TabContent = ({ activeTab }: { activeTab: string }) => {
  const swapHistory = mangoStore((s) => s.mangoAccount.stats.swapHistory.data)
  const loading = mangoStore((s) => s.mangoAccount.stats.swapHistory.loading)
  switch (activeTab) {
    case 'balances':
      return <TokenList />
    case 'activity:activity':
      return <ActivityFeed />
    case 'swap:swap-history':
      return <SwapHistoryTable swapHistory={swapHistory} loading={loading} />
    default:
      return <TokenList />
  }
}

export default AccountTabs
