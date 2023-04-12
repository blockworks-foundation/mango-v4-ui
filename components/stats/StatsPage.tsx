import TabButtons from '@components/shared/TabButtons'
import mangoStore from '@store/mangoStore'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoGroup from 'hooks/useMangoGroup'
import { useViewport } from 'hooks/useViewport'
import { useEffect, useMemo } from 'react'
import { STATS_TAB_KEY } from 'utils/constants'
import { breakpoints } from 'utils/theme'
import MangoStats from './MangoStats'
import PerpMarketsTable from './PerpMarketsTable'
import SpotMarketsTable from './SpotMarketsTable'
import TokenStats from './TokenStats'

// const TABS = ['tokens', 'perp', 'spot', 'mango']
const TABS = ['tokens', 'perp-markets', 'spot-markets', 'mango-stats']

const StatsPage = () => {
  const [activeTab, setActiveTab] = useLocalStorageState(
    STATS_TAB_KEY,
    'tokens'
  )
  const actions = mangoStore.getState().actions
  const perpStats = mangoStore((s) => s.perpStats.data)
  const { group } = useMangoGroup()
  const { width } = useViewport()
  const fullWidthTabs = width ? width < breakpoints.lg : false

  useEffect(() => {
    if (group && (!perpStats || !perpStats.length)) {
      actions.fetchPerpStats()
    }
  }, [group, perpStats])

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
    case 'perp-markets':
      return <PerpMarketsTable />
    case 'spot-markets':
      return <SpotMarketsTable />
    case 'mango-stats':
      return <MangoStats />
    default:
      return <TokenStats />
  }
}
