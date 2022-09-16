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
        <div className="flex h-[49px] items-center border-b border-th-bkg-3 px-4 ">
          <h2 className="text-sm text-th-fgd-3">Orderbook</h2>
        </div>
        <div className="flex items-center justify-between px-4 py-2 text-xs text-th-fgd-4">
          <div>Size</div>
          <div>Price</div>
        </div>
        <div className="hide-scroll h-full overflow-y-scroll">
          <Orderbook depth={6} />
        </div>
      </div>
      <div className="col-span-2 border-t border-th-bkg-3 sm:col-span-3">
        <BalanceAndOpenOrders />
      </div>
    </div>
  )
}

export default MobileTradeAdvancedPage
