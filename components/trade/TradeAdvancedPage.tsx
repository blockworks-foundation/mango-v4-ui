import { useCallback, useEffect, useMemo, useState } from 'react'
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
import MobileTradeAdvancedPage from './MobileTradeAdvancedPage'
import OrderbookAndTrades from './OrderbookAndTrades'

const TradingViewChart = dynamic(() => import('./TradingViewChart'), {
  ssr: false,
})

const ResponsiveGridLayout = WidthProvider(Responsive)
const getCurrentBreakpoint = () => {
  // @ts-ignore
  return Responsive.utils.getBreakpointFromWidth(
    gridBreakpoints,
    window.innerWidth - 63
  )
}

const sidebarWidth = 65
const totalCols = 24
const gridBreakpoints = {
  md: breakpoints.md - sidebarWidth,
  lg: breakpoints.lg - sidebarWidth,
  xl: breakpoints.xl - sidebarWidth,
  xxl: breakpoints['2xl'] - sidebarWidth,
  xxxl: breakpoints['3xl'] - sidebarWidth,
}

const getHeight = (
  pageHeight: number,
  minHeight: number,
  remainingRowHeight: number
) => {
  return Math.max(minHeight, pageHeight - remainingRowHeight)
}

const TradeAdvancedPage = () => {
  const { height, width } = useViewport()
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>()
  const { uiLocked } = mangoStore((s) => s.settings)
  const showMobileView = width <= breakpoints.md

  const defaultLayouts: ReactGridLayout.Layouts = useMemo(() => {
    const topnavbarHeight = 67
    const innerHeight = Math.max(height - topnavbarHeight, 800)
    const marketHeaderHeight = 48

    return {
      xxxl: [
        { i: 'market-header', x: 0, y: 0, w: 16, h: marketHeaderHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 16, h: 676 },
        {
          i: 'balances',
          x: 0,
          y: 2,
          w: 16,
          h: getHeight(innerHeight, 300, 676 + marketHeaderHeight),
        },
        {
          i: 'orderbook',
          x: 16,
          y: 0,
          w: 4,
          h: getHeight(innerHeight, 976, marketHeaderHeight),
        },
        { i: 'trade-form', x: 20, y: 0, w: 4, h: getHeight(innerHeight, 0, 0) },
      ],
      xxl: [
        { i: 'market-header', x: 0, y: 0, w: 15, h: marketHeaderHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 15, h: 576 },
        {
          i: 'balances',
          x: 0,
          y: 2,
          w: 15,
          h: getHeight(innerHeight, 300, 576 + marketHeaderHeight),
        },
        {
          i: 'orderbook',
          x: 15,
          y: 0,
          w: 4,
          h: getHeight(innerHeight, 876, marketHeaderHeight),
        },
        { i: 'trade-form', x: 19, y: 0, w: 5, h: getHeight(innerHeight, 0, 0) },
      ],
      xl: [
        { i: 'market-header', x: 0, y: 0, w: 14, h: marketHeaderHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 14, h: 520 },
        {
          i: 'balances',
          x: 0,
          y: 2,
          w: 14,
          h: getHeight(innerHeight, 300, 520 + marketHeaderHeight),
        },
        {
          i: 'orderbook',
          x: 14,
          y: 0,
          w: 5,
          h: getHeight(innerHeight, 820, marketHeaderHeight),
        },
        { i: 'trade-form', x: 19, y: 0, w: 5, h: getHeight(innerHeight, 0, 0) },
      ],
      lg: [
        { i: 'market-header', x: 0, y: 0, w: 14, h: marketHeaderHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 14, h: 520 },
        {
          i: 'balances',
          x: 0,
          y: 2,
          w: 14,
          h: getHeight(innerHeight, 300, 520 + marketHeaderHeight),
        },
        {
          i: 'orderbook',
          x: 14,
          y: 0,
          w: 5,
          h: getHeight(innerHeight, 820, marketHeaderHeight),
        },
        { i: 'trade-form', x: 19, y: 0, w: 5, h: getHeight(innerHeight, 0, 0) },
      ],
      md: [
        { i: 'market-header', x: 0, y: 0, w: 18, h: marketHeaderHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 18, h: 520 },
        { i: 'balances', x: 0, y: 2, w: 18, h: 488 },
        { i: 'orderbook', x: 18, y: 2, w: 6, h: 489 },
        { i: 'trade-form', x: 18, y: 1, w: 6, h: 568 },
      ],
    }
  }, [height])

  const [savedLayouts, setSavedLayouts] = useLocalStorageState(
    GRID_LAYOUT_KEY,
    defaultLayouts
  )

  const onLayoutChange = useCallback((layouts: ReactGridLayout.Layouts) => {
    if (layouts) {
      setSavedLayouts(layouts)
    }
  }, [])

  const onBreakpointChange = useCallback((newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint)
  }, [])

  return showMobileView ? (
    <MobileTradeAdvancedPage />
  ) : (
    <ResponsiveGridLayout
      // layouts={savedLayouts ? savedLayouts : defaultLayouts}
      layouts={defaultLayouts}
      breakpoints={gridBreakpoints}
      cols={{
        xxxl: totalCols,
        xxl: totalCols,
        xl: totalCols,
        lg: totalCols,
        md: totalCols,
        sm: totalCols,
      }}
      rowHeight={1}
      isDraggable={!uiLocked}
      isResizable={!uiLocked}
      onBreakpointChange={(newBreakpoint) => onBreakpointChange(newBreakpoint)}
      onLayoutChange={(layout, layouts) => onLayoutChange(layouts)}
      measureBeforeMount
      containerPadding={[0, 0]}
      margin={[0, 0]}
      useCSSTransforms
    >
      <div key="market-header" className="z-10">
        <AdvancedMarketHeader />
      </div>
      <div key="tv-chart" className="h-full border border-x-0 border-th-bkg-3">
        <div className={`relative h-full overflow-auto`}>
          <TradingViewChart />
        </div>
      </div>
      <div key="balances">
        <BalanceAndOpenOrders />
      </div>
      <div
        key="trade-form"
        className="border border-t-0 border-r-0 border-th-bkg-3 md:border-b lg:border-b-0"
      >
        <AdvancedTradeForm />
      </div>
      <div
        key="orderbook"
        className="border border-y-0 border-r-0 border-th-bkg-3"
      >
        <OrderbookAndTrades />
      </div>
    </ResponsiveGridLayout>
  )
}

export default TradeAdvancedPage
