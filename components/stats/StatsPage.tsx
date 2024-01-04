import TabButtons from '@components/shared/TabButtons'
import TokenPage from '@components/token/TokenPage'
import mangoStore from '@store/mangoStore'
import { useViewport } from 'hooks/useViewport'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { breakpoints } from 'utils/theme'
import MangoStats from './mango/MangoStats'
import PerpStats from './perps/PerpStats'
import PerpStatsPage from './perps/PerpStatsPage'
import TokenStats from './tokens/TokenStats'

const TABS = ['tokens', 'perp-markets', 'mango-stats']

const StatsPage = () => {
  const [activeTab, setActiveTab] = useState('tokens')
  const perpPositionsStatsNotLoaded = mangoStore(
    (s) => s.perpStats.positions.initialLoad,
  )
  const { width } = useViewport()
  const fullWidthTabs = width ? width < breakpoints.lg : false
  const router = useRouter()
  const { market } = router.query
  const { token } = router.query

  useEffect(() => {
    if (perpPositionsStatsNotLoaded) {
      const actions = mangoStore.getState().actions
      actions.fetchPositionsStats()
    }
  }, [perpPositionsStatsNotLoaded])

  const tabsWithCount: [string, number][] = useMemo(() => {
    return TABS.map((t) => [t, 0])
  }, [])
  return (
    <>
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
    </>
  )
}

export default StatsPage

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'tokens':
      return <TokenStats />
    case 'perp-markets':
      return <PerpStats />
    case 'mango-stats':
      return <MangoStats />
    default:
      return <TokenStats />
  }
}
