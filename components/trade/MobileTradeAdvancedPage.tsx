import { useCallback, useEffect, useState } from 'react'
import Orderbook from './Orderbook'
import AdvancedMarketHeader from './AdvancedMarketHeader'
import AdvancedTradeForm from './AdvancedTradeForm'
import TradeInfoTabs from './TradeInfoTabs'

const MobileTradeAdvancedPage = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3">
      <div className="col-span-2 border-b border-th-bkg-3 sm:col-span-3">
        <AdvancedMarketHeader />
      </div>
      {/* <div className="col-span-2 h-72 overflow-auto border-b border-th-bkg-3 sm:col-span-3 sm:h-96">
        <TradingViewChart />
      </div> */}
      <div className="col-span-1 pb-6 sm:col-span-2">
        <AdvancedTradeForm />
      </div>
      <div className="col-span-1 border-l border-th-bkg-3">
        <Orderbook />
      </div>
      <div className="col-span-2 border-t border-th-bkg-3 sm:col-span-3">
        <TradeInfoTabs />
      </div>
    </div>
  )
}

export default MobileTradeAdvancedPage
