import TabButtons from '@components/shared/TabButtons'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { useViewport } from 'hooks/useViewport'
import { useEffect, useMemo, useState } from 'react'
import { breakpoints } from 'utils/theme'
import MangoStats from './MangoStats'
import PerpStats from './PerpStats'
import SpotMarketsTable from './SpotMarketsTable'
import TokenStats from './TokenStats'

// const TABS = ['tokens', 'perp', 'spot', 'mango']
const TABS = ['tokens', 'perp', 'spot', 'mango']

const StatsPage = () => {
  const [activeTab, setActiveTab] = useState('tokens')
  const actions = mangoStore.getState().actions
  const { group } = useMangoGroup()
  const { width } = useViewport()
  const fullWidthTabs = width ? width < breakpoints.lg : false

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
          fillWidth={fullWidthTabs}
          onChange={(v) => setActiveTab(v)}
          showBorders
          values={tabsWithCount}
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
