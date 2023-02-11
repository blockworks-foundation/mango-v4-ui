import { useState } from 'react'
import Orderbook from './Orderbook'
import AdvancedMarketHeader from './AdvancedMarketHeader'
import AdvancedTradeForm from './AdvancedTradeForm'
import TradeInfoTabs from './TradeInfoTabs'
import TabButtons from '@components/shared/TabButtons'
import { TABS } from './OrderbookAndTrades'
import RecentTrades from './RecentTrades'
import TradingChartContainer from './TradingChartContainer'

const MobileTradeAdvancedPage = () => {
  const [activeTab, setActiveTab] = useState('trade:book')
  const [showChart, setShowChart] = useState(false)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3">
      <div className="col-span-2 border-b border-th-bkg-3 sm:col-span-3">
        <AdvancedMarketHeader
          showChart={showChart}
          setShowChart={setShowChart}
        />
      </div>
      {showChart ? (
        <div className="col-span-2 h-80 border-b border-th-bkg-3 sm:col-span-3">
          <TradingChartContainer />
        </div>
      ) : null}
      <div className="col-span-1 pb-6 sm:col-span-2">
        <AdvancedTradeForm />
      </div>
      <div className="col-span-1 border-l border-th-bkg-3">
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
      <div className="col-span-2 border-t border-th-bkg-3 sm:col-span-3">
        <TradeInfoTabs />
      </div>
    </div>
  )
}

export default MobileTradeAdvancedPage
