import TabButtons from '@components/shared/TabButtons'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { useEffect, useMemo, useState } from 'react'
import MangoStats from './MangoStats'
import PerpStats from './PerpStats'
import SpotMarketsTable from './SpotMarketsTable'
import TokenStats from './TokenStats'

// const TABS = ['tokens', 'perp', 'spot', 'mango']
const TABS =
  process.env.NEXT_PUBLIC_SHOW_PERPS === 'true'
    ? ['tokens', 'perp', 'spot', 'mango']
    : ['tokens', 'spot', 'mango']

const StatsPage = () => {
  const [activeTab, setActiveTab] = useState('tokens')
  const actions = mangoStore((s) => s.actions)
  const { group } = useMangoGroup()

  useEffect(() => {
    if (group) {
      actions.fetchPerpStats()
    }
  }, [group])

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
      return <PerpStats />
    case 'spot':
      return <SpotMarketsTable />
    case 'mango':
      return <MangoStats />
    default:
      return <TokenStats />
  }
}
