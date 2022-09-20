import { useCallback, useEffect, useState } from 'react'
// import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import ReactGridLayout, { Responsive, WidthProvider } from 'react-grid-layout'

import mangoStore from '@store/mangoStore'
import { GRID_LAYOUT_KEY } from 'utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { breakpoints } from 'utils/theme'
import { useViewport } from 'hooks/useViewport'
import Orderbook from './Orderbook'
import AdvancedMarketHeader from './AdvancedMarketHeader'
import AdvancedTradeForm from './AdvancedTradeForm'
import BalanceAndOpenOrders from './BalanceAndOpenOrders'
import TradingViewChart from './TradingViewChart'

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
        <BalanceAndOpenOrders />
      </div>
    </div>
  )
}

export default MobileTradeAdvancedPage
