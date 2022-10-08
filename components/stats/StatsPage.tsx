import TabButtons from '@components/shared/TabButtons'
import { useMemo, useState } from 'react'
import SpotMarketsTable from './SpotMarketsTable'
import TokenStats from './TokenStats'

const TABS = ['tokens', 'spot']

const StatsPage = () => {
  const [activeTab, setActiveTab] = useState('tokens')
  const tabsWithCount: [string, number][] = useMemo(() => {
    return TABS.map((t) => [t, 0])
  }, [])
  return (
    <div className="pb-20 md:pb-16">
      <TabButtons
        activeValue={activeTab}
        onChange={(v) => setActiveTab(v)}
        values={tabsWithCount}
        showBorders
      />
      <TabContent activeTab={activeTab} />
    </div>
  )
}

export default StatsPage

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'tokens':
      return <TokenStats />
    case 'spot':
      return <SpotMarketsTable />
    default:
      return <TokenStats />
  }
}
