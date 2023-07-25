import TabButtons from '@components/shared/TabButtons'
import { useState } from 'react'
import Orderbook from './Orderbook'
import RecentTrades from './RecentTrades'
import DepthChart from './DepthChart'

export const TABS: [string, number][] = [
  ['trade:book', 0],
  ['trade:depth', 0],
  ['trade:trades', 0],
]

const OrderbookAndTrades = () => {
  const [activeTab, setActiveTab] = useState('trade:book')

  return (
    <div className="h-full">
      <div className="hide-scroll overflow-x-auto border-b border-th-bkg-3">
        <TabButtons
          activeValue={activeTab}
          onChange={(tab: string) => setActiveTab(tab)}
          values={TABS}
          fillWidth
          showBorders
        />
      </div>
      <div
        className={`h-full ${
          activeTab === 'trade:book' ? 'visible' : 'hidden'
        }`}
      >
        <Orderbook />
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
