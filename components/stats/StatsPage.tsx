import TabButtons from '@components/shared/TabButtons'
import { useMemo, useState } from 'react'
import PerpMarketsTable from './PerpMarketsTable'
import SpotMarketsTable from './SpotMarketsTable'
import TokenStats from './TokenStats'

const TABS =
  process.env.NEXT_PUBLIC_SHOW_PERPS === 'true'
    ? ['tokens', 'perp', 'spot']
    : ['tokens', 'spot']

const StatsPage = () => {
  const [activeTab, setActiveTab] = useState('tokens')
  const tabsWithCount: [string, number][] = useMemo(() => {
    return TABS.map((t) => [t, 0])
  }, [])
  return (
    <div className="pb-20 md:pb-16">
      <div className="border-b border-th-bkg-3">
        <TabButtons
          activeValue={activeTab}
          onChange={(v) => setActiveTab(v)}
          values={tabsWithCount}
          showBorders
        />
      </div>
      <TabContent activeTab={activeTab} />
    </div>
  )
}

export default StatsPage

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'tokens':
      return <TokenStats />
    case 'perp':
      return <PerpMarketsTable />
    case 'spot':
      return <SpotMarketsTable />
    default:
      return <TokenStats />
  }
}
