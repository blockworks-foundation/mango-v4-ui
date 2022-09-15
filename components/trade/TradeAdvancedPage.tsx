import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'next-i18next'
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

const ResponsiveGridLayout = WidthProvider(Responsive)

const TradingViewChart = dynamic(() => import('./TradingViewChart'), {
  ssr: false,
})

const gridBreakpoints = {
  // sm: breakpoints.sm,
  // md: breakpoints.md,
  // lg: breakpoints.lg,
  xl: breakpoints.xl,
  xxl: breakpoints['2xl'],
  xxxl: breakpoints['3xl'],
}
const totalCols = 24
const TradeAdvancedPage = () => {
  const { height } = useViewport()
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>()
  const [orderbookDepth, setOrderbookDepth] = useState(12)
  const { uiLocked } = mangoStore((s) => s.settings)

  const defaultLayouts: ReactGridLayout.Layouts = useMemo(() => {
    const innerHeight = Math.max(height - 36, 800)
    const tvChartHeight = 432
    const headerHeight = 48
    const balancesHeight = innerHeight - tvChartHeight - headerHeight

    return {
      xxxl: [
        { i: 'market-header', x: 0, y: 0, w: 16, h: headerHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 16, h: tvChartHeight },
        { i: 'balances', x: 0, y: 2, w: 16, h: balancesHeight },
        { i: 'orderbook', x: 16, y: 1, w: 4, h: innerHeight },
        { i: 'trade-form', x: 20, y: 1, w: 4, h: innerHeight },
      ],
      xxl: [
        { i: 'market-header', x: 0, y: 0, w: 14, h: headerHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 14, h: tvChartHeight },
        { i: 'balances', x: 0, y: 2, w: 14, h: balancesHeight },
        { i: 'orderbook', x: 14, y: 1, w: 5, h: innerHeight },
        { i: 'trade-form', x: 20, y: 1, w: 5, h: innerHeight },
      ],
      xl: [
        { i: 'market-header', x: 0, y: 0, w: 14, h: headerHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 14, h: tvChartHeight },
        { i: 'balances', x: 0, y: 2, w: 14, h: balancesHeight },
        { i: 'orderbook', x: 14, y: 1, w: 5, h: innerHeight },
        { i: 'trade-form', x: 20, y: 1, w: 5, h: innerHeight },
      ],
    }
  }, [height])

  const [savedLayouts, setSavedLayouts] = useLocalStorageState(
    GRID_LAYOUT_KEY,
    defaultLayouts
  )

  useEffect(() => {
    const adjustOrderBook = (
      layouts: ReactGridLayout.Layouts,
      breakpoint?: string | null
    ) => {
      const bp = 'xxl'
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

  return (
    <div className="relative">
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
        onBreakpointChange={(newBreakpoint) =>
          onBreakpointChange(newBreakpoint)
        }
        onLayoutChange={(layout, layouts) => onLayoutChange(layouts)}
        measureBeforeMount
        containerPadding={{ xxl: [0, 0] }}
        margin={[0, 0]}
      >
        <div key="market-header" className="z-10">
          <AdvancedMarketHeader />
        </div>
        <div
          key="tv-chart"
          className="h-full border border-x-0 border-th-bkg-3"
        >
          <div className={`relative h-full overflow-auto`}>
            <TradingViewChart />
          </div>
        </div>
        <div
          key="balances"
          className="h-full border border-x-0 border-t-0 border-th-bkg-3"
        >
          <BalanceAndOpenOrders />
        </div>
        <div key="orderbook" className="border border-t-0 border-th-bkg-3">
          <div className="flex h-[49px] items-center border-b border-th-bkg-3 px-4 ">
            <h2 className="text-sm text-th-fgd-3">Orderbook</h2>
          </div>
          <div className="flex items-center justify-between px-4 py-2 text-xs text-th-fgd-4">
            <div>Size</div>
            <div>Price</div>
          </div>
          <div className="hide-scroll h-full overflow-y-scroll">
            <Orderbook depth={orderbookDepth} />
          </div>
        </div>
        <div
          key="trade-form"
          className="border border-x-0 border-t-0 border-th-bkg-3"
        >
          <AdvancedTradeForm />
        </div>
      </ResponsiveGridLayout>
    </div>
  )
}

export default TradeAdvancedPage
