import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import ReactGridLayout, { Responsive, WidthProvider } from 'react-grid-layout'

import mangoStore from '@store/mangoStore'
// import { IS_ONBOARDED_KEY } from 'utils/constants'
// import useLocalStorageState from 'hooks/useLocalStorageState'
import { breakpoints } from 'utils/theme'
import { useViewport } from 'hooks/useViewport'
import AdvancedMarketHeader from './AdvancedMarketHeader'
import AdvancedTradeForm from './AdvancedTradeForm'
import TradeInfoTabs from './TradeInfoTabs'
import MobileTradeAdvancedPage from './MobileTradeAdvancedPage'
import OrderbookAndTrades from './OrderbookAndTrades'
// import { useWallet } from '@solana/wallet-adapter-react'
// import TradeOnboardingTour from '@components/tours/TradeOnboardingTour'
import FavoriteMarketsBar from './FavoriteMarketsBar'

const TradingViewChart = dynamic(() => import('./TradingViewChart'), {
  ssr: false,
})

const ResponsiveGridLayout = WidthProvider(Responsive)

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
  const { uiLocked } = mangoStore((s) => s.settings)
  const showMobileView = width <= breakpoints.md
  // const tourSettings = mangoStore((s) => s.settings.tours)
  // const { connected } = useWallet()
  // const [isOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)

  const defaultLayouts: ReactGridLayout.Layouts = useMemo(() => {
    const topnavbarHeight = 67
    const innerHeight = Math.max(height - topnavbarHeight, 1000)
    const marketHeaderHeight = 48

    return {
      xxxl: [
        { i: 'market-header', x: 0, y: 0, w: 16, h: marketHeaderHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 16, h: 640 },
        {
          i: 'balances',
          x: 0,
          y: 2,
          w: 16,
          h: getHeight(innerHeight, 0, 640 + marketHeaderHeight),
        },
        {
          i: 'orderbook',
          x: 16,
          y: 0,
          w: 4,
          h: getHeight(innerHeight, 0, 0),
        },
        { i: 'trade-form', x: 20, y: 0, w: 4, h: getHeight(innerHeight, 0, 0) },
      ],
      xxl: [
        { i: 'market-header', x: 0, y: 0, w: 15, h: marketHeaderHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 15, h: 536 },
        {
          i: 'balances',
          x: 0,
          y: 2,
          w: 15,
          h: getHeight(innerHeight, 0, 536 + marketHeaderHeight),
        },
        {
          i: 'orderbook',
          x: 15,
          y: 0,
          w: 4,
          h: getHeight(innerHeight, 0, 0),
        },
        { i: 'trade-form', x: 19, y: 0, w: 5, h: getHeight(innerHeight, 0, 0) },
      ],
      xl: [
        { i: 'market-header', x: 0, y: 0, w: 14, h: marketHeaderHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 14, h: 488 },
        {
          i: 'balances',
          x: 0,
          y: 2,
          w: 14,
          h: getHeight(innerHeight, 0, 488 + marketHeaderHeight),
        },
        {
          i: 'orderbook',
          x: 14,
          y: 0,
          w: 5,
          h: getHeight(innerHeight, 0, 0),
        },
        {
          i: 'trade-form',
          x: 19,
          y: 0,
          w: 5,
          h: getHeight(innerHeight, 0, 0),
        },
      ],
      lg: [
        { i: 'market-header', x: 0, y: 0, w: 12, h: marketHeaderHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 12, h: 488 },
        {
          i: 'balances',
          x: 0,
          y: 2,
          w: 12,
          h: getHeight(innerHeight, 0, 488 + marketHeaderHeight),
        },
        {
          i: 'orderbook',
          x: 12,
          y: 0,
          w: 6,
          h: getHeight(innerHeight, 0, 0),
        },
        { i: 'trade-form', x: 18, y: 0, w: 6, h: getHeight(innerHeight, 0, 0) },
      ],
      md: [
        { i: 'market-header', x: 0, y: 0, w: 18, h: marketHeaderHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 17, h: 464 },
        { i: 'balances', x: 0, y: 2, w: 17, h: 428 + marketHeaderHeight },
        { i: 'orderbook', x: 18, y: 2, w: 7, h: 428 + marketHeaderHeight },
        { i: 'trade-form', x: 18, y: 1, w: 7, h: 464 + marketHeaderHeight },
      ],
    }
  }, [height])

  return showMobileView ? (
    <MobileTradeAdvancedPage />
  ) : (
    <>
      <FavoriteMarketsBar />
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
        containerPadding={[0, 0]}
        margin={[0, 0]}
        useCSSTransforms
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
        <div key="balances">
          <TradeInfoTabs />
        </div>
        <div
          className="border-l border-b border-th-bkg-3 lg:border-l-0 lg:border-b-0"
          key="trade-form"
        >
          <AdvancedTradeForm />
        </div>
        <div
          key="orderbook"
          className="overflow-hidden border-l border-th-bkg-3 lg:border-r"
        >
          <OrderbookAndTrades />
        </div>
      </ResponsiveGridLayout>
      {/* {!tourSettings?.trade_tour_seen && isOnboarded && connected ? (
        <TradeOnboardingTour />
      ) : null} */}
    </>
  )
}

export default TradeAdvancedPage
