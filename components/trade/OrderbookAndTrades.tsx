import TabButtons from '@components/shared/TabButtons'
import { useEffect, useMemo, useState } from 'react'
import Orderbook from './Orderbook'
import RecentTrades from './RecentTrades'
import DepthChart from './DepthChart'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { DEPTH_CHART_KEY } from 'utils/constants'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'

export const TABS: [string, number][] = [
  ['trade:book', 0],
  ['trade:depth', 0],
  ['trade:trades', 0],
]

const OrderbookAndTrades = () => {
  const [activeTab, setActiveTab] = useState('trade:book')
  const [showDepthChart] = useLocalStorageState<boolean>(DEPTH_CHART_KEY, false)
  const { width } = useViewport()
  const hideDepthTab = width ? width > breakpoints.lg : false

  const tabsToShow = useMemo(() => {
    if (hideDepthTab) {
      return TABS.filter((t) => !t[0].includes('depth'))
    }
    return TABS
  }, [hideDepthTab])

  useEffect(() => {
    if (hideDepthTab && activeTab === 'trade:depth') {
      setActiveTab('trade:book')
    }
  }, [activeTab, hideDepthTab])

  return (
    <div className="hide-scroll h-full">
      <div className="hide-scroll overflow-x-auto border-b border-th-bkg-3">
        <TabButtons
          activeValue={activeTab}
          onChange={(tab: string) => setActiveTab(tab)}
          values={tabsToShow}
          fillWidth={!showDepthChart || !hideDepthTab}
          showBorders
        />
      </div>
      <div
        className={`flex ${activeTab === 'trade:book' ? 'visible' : 'hidden'}`}
      >
        {showDepthChart ? (
          <div className="hidden w-1/2 border-r border-th-bkg-3 lg:block">
            <DepthChart />
          </div>
        ) : null}
        <div className={showDepthChart ? 'w-full lg:w-1/2' : 'w-full'}>
          <Orderbook />
        </div>
      </div>
      <div
        className={`h-full ${
          activeTab === 'trade:depth' ? 'visible' : 'hidden'
        }`}
      >
        <DepthChart />
      </div>
      <div
        className={`h-full ${
          activeTab === 'trade:trades' ? 'visible' : 'hidden'
        }`}
      >
        <RecentTrades />
      </div>
    </div>
  )
}

export default OrderbookAndTrades
