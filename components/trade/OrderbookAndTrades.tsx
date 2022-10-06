import TabButtons from '@components/shared/TabButtons'
import { useState } from 'react'
import Orderbook from './Orderbook'
import RecentTrades from './RecentTrades'

const TABS: [string, number][] = [
  ['trade:book', 0],
  ['trade:trades', 0],
]

const OrderbookAndTrades = () => {
  const [activeTab, setActiveTab] = useState('trade:book')
  return (
    <div className="hide-scroll h-full">
      <div className="border-b border-r border-th-bkg-3">
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
        <Orderbook />
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
