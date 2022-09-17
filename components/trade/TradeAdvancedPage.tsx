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
import MobileTradeAdvancedPage from './MobileTradeAdvancedPage'

const ResponsiveGridLayout = WidthProvider(Responsive)

const TradingViewChart = dynamic(() => import('./TradingViewChart'), {
  ssr: false,
})

const sidebarWidth = 65

const gridBreakpoints = {
  md: breakpoints.md - sidebarWidth,
  lg: breakpoints.lg - sidebarWidth,
  xl: breakpoints.xl - sidebarWidth,
  xxl: breakpoints['2xl'] - sidebarWidth,
  xxxl: breakpoints['3xl'] - sidebarWidth,
}
const totalCols = 24

const defaultLayouts = {
  xxxl: [
    { i: 'market-header', x: 0, y: 0, w: 16, h: 48 },
    { i: 'tv-chart', x: 0, y: 1, w: 16, h: 676 },
    { i: 'balances', x: 0, y: 2, w: 16, h: 388 },
    { i: 'orderbook', x: 16, y: 0, w: 4, h: 1113 },
    { i: 'trade-form', x: 20, y: 0, w: 4, h: 1113 },
  ],
  xxl: [
    { i: 'market-header', x: 0, y: 0, w: 15, h: 48 },
    { i: 'tv-chart', x: 0, y: 1, w: 15, h: 576 },
    { i: 'balances', x: 0, y: 2, w: 15, h: 388 },
    { i: 'orderbook', x: 15, y: 0, w: 4, h: 1013 },
    { i: 'trade-form', x: 19, y: 0, w: 5, h: 1013 },
  ],
  xl: [
    { i: 'market-header', x: 0, y: 0, w: 14, h: 48 },
    { i: 'tv-chart', x: 0, y: 1, w: 14, h: 520 },
    { i: 'balances', x: 0, y: 2, w: 14, h: 388 },
    { i: 'orderbook', x: 14, y: 0, w: 4, h: 957 },
    { i: 'trade-form', x: 18, y: 0, w: 6, h: 957 },
  ],
  lg: [
    { i: 'market-header', x: 0, y: 0, w: 14, h: 48 },
    { i: 'tv-chart', x: 0, y: 1, w: 14, h: 520 },
    { i: 'balances', x: 0, y: 2, w: 14, h: 388 },
    { i: 'orderbook', x: 14, y: 0, w: 4, h: 957 },
    { i: 'trade-form', x: 18, y: 0, w: 6, h: 957 },
  ],
  md: [
    { i: 'market-header', x: 0, y: 0, w: 18, h: 48 },
    { i: 'tv-chart', x: 0, y: 1, w: 18, h: 520 },
    { i: 'balances', x: 0, y: 2, w: 18, h: 488 },
    { i: 'orderbook', x: 18, y: 2, w: 6, h: 489 },
    { i: 'trade-form', x: 18, y: 1, w: 6, h: 568 },
  ],
}

const TradeAdvancedPage = () => {
  const { height, width } = useViewport()
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>()
  const [orderbookDepth, setOrderbookDepth] = useState(6)
  const { uiLocked } = mangoStore((s) => s.settings)
  const showMobileView = width <= breakpoints.md

  // const defaultLayouts: ReactGridLayout.Layouts = useMemo(() => {
  //   const innerHeight = Math.max(height - 36, 800)
  //   const tvChartHeight = 432
  //   const headerHeight = 48
  //   const balancesHeight = innerHeight - tvChartHeight - headerHeight

  //   return {
  //     xxxl: [
  //       { i: 'market-header', x: 0, y: 0, w: 16, h: headerHeight },
  //       { i: 'tv-chart', x: 0, y: 1, w: 16, h: tvChartHeight },
  //       { i: 'balances', x: 0, y: 2, w: 16, h: balancesHeight },
  //       { i: 'orderbook', x: 16, y: 1, w: 4, h: innerHeight },
  //       { i: 'trade-form', x: 20, y: 1, w: 4, h: innerHeight },
  //     ],
  //     xxl: [
  //       { i: 'market-header', x: 0, y: 0, w: 14, h: headerHeight },
  //       { i: 'tv-chart', x: 0, y: 1, w: 14, h: tvChartHeight },
  //       { i: 'balances', x: 0, y: 2, w: 14, h: balancesHeight },
  //       { i: 'orderbook', x: 14, y: 1, w: 5, h: innerHeight },
  //       { i: 'trade-form', x: 20, y: 1, w: 5, h: innerHeight },
  //     ],
  //     xl: [
  //       { i: 'market-header', x: 0, y: 0, w: 14, h: headerHeight },
  //       { i: 'tv-chart', x: 0, y: 1, w: 14, h: tvChartHeight },
  //       { i: 'balances', x: 0, y: 2, w: 14, h: balancesHeight },
  //       { i: 'orderbook', x: 14, y: 1, w: 5, h: innerHeight },
  //       { i: 'trade-form', x: 20, y: 1, w: 5, h: innerHeight },
  //     ],
  //   }
  // }, [height])

  const [savedLayouts, setSavedLayouts] = useLocalStorageState(
    GRID_LAYOUT_KEY,
    defaultLayouts
  )

  // const getCurrentBreakpoint = () => {
  //   const breakpointsArray = Object.entries(gridBreakpoints)
  //   let bp
  //   for (let i = 0; i < breakpointsArray.length; ++i) {
  //     if (
  //       width > breakpointsArray[i][1] &&
  //       width < breakpointsArray[i + 1][1] &&
  //       i <= breakpointsArray.length - 1
  //     ) {
  //       bp = breakpointsArray[i][0]
  //     } else if (width >= breakpointsArray[breakpointsArray.length - 1][1]) {
  //       bp = breakpointsArray[breakpointsArray.length - 1][0]
  //     }
  //   }

  //   return bp
  // }

  useEffect(() => {
    const adjustOrderBook = (
      layouts: ReactGridLayout.Layouts,
      breakpoint?: string | null
    ) => {
      const bp = 'xxl'
      if (bp) {
        const orderbookLayout = layouts[bp].find((obj) => {
          return obj.i === 'orderbook'
        })
        let depth = orderbookLayout!.h / 24 / 2 - 2
        const maxNum = Math.max(1, depth)
        if (typeof maxNum === 'number') {
          depth = Math.round(maxNum)
        }

        setOrderbookDepth(depth)
      }
    }

    adjustOrderBook(defaultLayouts, currentBreakpoint)
  }, [currentBreakpoint, defaultLayouts])

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
    >
      <div key="market-header">
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
        <Orderbook depth={orderbookDepth} />
      </div>
    </ResponsiveGridLayout>
  )
}

export default TradeAdvancedPage
