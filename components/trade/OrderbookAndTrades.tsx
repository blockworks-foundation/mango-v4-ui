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
  const [grouping, setGrouping] = useState(0.01)
  return (
    <div className="hide-scroll h-full">
      <div className="border-b border-th-bkg-3">
        <TabButtons
          activeValue={activeTab}
          onChange={(tab: string) => setActiveTab(tab)}
          values={TABS}
          fillWidth
        />
      </div>
      <div
        className={`h-full ${
          activeTab === 'trade:book' ? 'visible' : 'hidden'
        }`}
      >
        <Orderbook grouping={grouping} setGrouping={setGrouping} />
      </div>
      <div
        className={`h-full ${
          activeTab === 'trade:depth' ? 'visible' : 'hidden'
        }`}
      >
        <DepthChart grouping={grouping} />
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
