import TabButtons from '@components/shared/TabButtons'
import TokenPage from '@components/token/TokenPage'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { useViewport } from 'hooks/useViewport'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { breakpoints } from 'utils/theme'
import MangoStats from './mango/MangoStats'
import PerpStats from './perps/PerpStats'
import PerpStatsPage from './perps/PerpStatsPage'
import SpotMarketsTable from './spot/SpotMarketsTable'
import TokenStats from './tokens/TokenStats'

const TABS = ['tokens', 'perp-markets', 'spot-markets', 'mango-stats']
const actions = mangoStore.getState().actions

const StatsPage = () => {
  const [activeTab, setActiveTab] = useState('tokens')
  const perpStats = mangoStore((s) => s.perpStats.data)
  const initialStatsLoad = mangoStore((s) => s.tokenStats.initialLoad)
  const perpPositionsStatsNotLoaded = mangoStore(
    (s) => s.perpStats.positions.initialLoad,
  )
  const { group } = useMangoGroup()
  const { width } = useViewport()
  const fullWidthTabs = width ? width < breakpoints.lg : false
  const router = useRouter()
  const { market } = router.query
  const { token } = router.query

  useEffect(() => {
    if (group && (!perpStats || !perpStats.length)) {
      actions.fetchPerpStats()
    }
  }, [group, perpStats])

  useEffect(() => {
    if (group && perpPositionsStatsNotLoaded) {
      actions.fetchPositionsStats()
    }
  }, [group, perpPositionsStatsNotLoaded])

  useEffect(() => {
    if (group && !initialStatsLoad) {
      const actions = mangoStore.getState().actions
      actions.fetchTokenStats()
    }
  }, [group, initialStatsLoad])

  const tabsWithCount: [string, number][] = useMemo(() => {
    return TABS.map((t) => [t, 0])
  }, [])
  return (
    <div className="pb-20 md:pb-[27px]">
      {market ? (
        <PerpStatsPage />
      ) : token ? (
        <TokenPage />
      ) : (
        <>
          <div className="hide-scroll overflow-x-auto border-b border-th-bkg-3">
            <TabButtons
              activeValue={activeTab}
              fillWidth={fullWidthTabs}
              onChange={(v) => setActiveTab(v)}
              showBorders
              values={tabsWithCount}
            />
          </div>
          <TabContent activeTab={activeTab} />
        </>
      )}
    </div>
  )
}

export default StatsPage

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'tokens':
      return <TokenStats />
    case 'perp-markets':
      return <PerpStats />
    case 'spot-markets':
      return <SpotMarketsTable />
    case 'mango-stats':
      return <MangoStats />
    default:
      return <TokenStats />
  }
}
