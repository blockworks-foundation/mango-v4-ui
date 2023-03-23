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
import useLocalStorageState from 'hooks/useLocalStorageState'
import { TRADE_LAYOUT_KEY } from 'utils/constants'

type TradeLayout =
  | 'chartLeft'
  | 'chartMiddleOBRight'
  | 'chartMiddleOBLeft'
  | 'chartRight'

const TradingChartContainer = dynamic(() => import('./TradingChartContainer'), {
  ssr: false,
})

const ResponsiveGridLayout = WidthProvider(Responsive)

const sidebarWidth = 63
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
  const [tradeLayout] = useLocalStorageState<TradeLayout>(
    TRADE_LAYOUT_KEY,
    'chartLeft'
  )

  const defaultLayouts: ReactGridLayout.Layouts = useMemo(() => {
    const topnavbarHeight = 67
    const innerHeight = Math.max(height - topnavbarHeight, 1000)
    const marketHeaderHeight = 48

    const balancesXPos = {
      chartLeft: { xxxl: 0, xxl: 0, xl: 0, lg: 0 },
      chartMiddleOBRight: { xxxl: 4, xxl: 5, xl: 5, lg: 6 },
      chartMiddleOBLeft: { xxxl: 4, xxl: 4, xl: 4, lg: 5 },
      chartRight: { xxxl: 9, xxl: 9, xl: 9, lg: 11 },
    }

    const chartXPos = {
      chartLeft: { xxxl: 0, xxl: 0, xl: 0, lg: 0 },
      chartMiddleOBRight: { xxxl: 4, xxl: 5, xl: 5, lg: 6 },
      chartMiddleOBLeft: { xxxl: 4, xxl: 4, xl: 4, lg: 5 },
      chartRight: { xxxl: 9, xxl: 9, xl: 9, lg: 11 },
    }

    const bookXPos = {
      chartLeft: { xxxl: 16, xxl: 15, xl: 15, lg: 13 },
      chartMiddleOBRight: { xxxl: 20, xxl: 20, xl: 20, lg: 19 },
      chartMiddleOBLeft: { xxxl: 0, xxl: 0, xl: 0, lg: 0 },
      chartRight: { xxxl: 4, xxl: 5, xl: 5, lg: 6 },
    }

    const formXPos = {
      chartLeft: { xxxl: 20, xxl: 19, xl: 19, lg: 18 },
      chartMiddleOBRight: { xxxl: 0, xxl: 0, xl: 0, lg: 0 },
      chartMiddleOBLeft: { xxxl: 20, xxl: 19, xl: 19, lg: 18 },
      chartRight: { xxxl: 0, xxl: 0, xl: 0, lg: 0 },
    }

    return {
      xxxl: [
        { i: 'market-header', x: 0, y: 0, w: 24, h: marketHeaderHeight },
        { i: 'tv-chart', x: chartXPos[tradeLayout].xxxl, y: 1, w: 16, h: 640 },
        {
          i: 'balances',
          x: balancesXPos[tradeLayout].xxxl,
          y: 2,
          w: 16,
          h: getHeight(innerHeight, 0, 640 + marketHeaderHeight),
        },
        {
          i: 'orderbook',
          x: bookXPos[tradeLayout].xxxl,
          y: 0,
          w: 4,
          h: getHeight(innerHeight, 0, 0),
        },
        {
          i: 'trade-form',
          x: formXPos[tradeLayout].xxxl,
          y: 0,
          w: 4,
          h: getHeight(innerHeight, 0, 0),
        },
      ],
      xxl: [
        { i: 'market-header', x: 0, y: 0, w: 24, h: marketHeaderHeight },
        { i: 'tv-chart', x: chartXPos[tradeLayout].xxl, y: 1, w: 15, h: 488 },
        {
          i: 'balances',
          x: balancesXPos[tradeLayout].xxl,
          y: 2,
          w: 15,
          h: getHeight(innerHeight, 0, 488 + marketHeaderHeight),
        },
        {
          i: 'orderbook',
          x: bookXPos[tradeLayout].xxl,
          y: 0,
          w: 4,
          h: getHeight(innerHeight, 0, 0),
        },
        {
          i: 'trade-form',
          x: formXPos[tradeLayout].xxl,
          y: 0,
          w: 5,
          h: getHeight(innerHeight, 0, 0),
        },
      ],
      xl: [
        { i: 'market-header', x: 0, y: 0, w: 24, h: marketHeaderHeight },
        { i: 'tv-chart', x: chartXPos[tradeLayout].xl, y: 1, w: 15, h: 488 },
        {
          i: 'balances',
          x: balancesXPos[tradeLayout].xl,
          y: 2,
          w: 15,
          h: getHeight(innerHeight, 0, 488 + marketHeaderHeight),
        },
        {
          i: 'orderbook',
          x: bookXPos[tradeLayout].xl,
          y: 0,
          w: 4,
          h: getHeight(innerHeight, 0, 0),
        },
        {
          i: 'trade-form',
          x: formXPos[tradeLayout].xl,
          y: 0,
          w: 5,
          h: getHeight(innerHeight, 0, 0),
        },
      ],
      lg: [
        { i: 'market-header', x: 0, y: 0, w: 24, h: marketHeaderHeight },
        { i: 'tv-chart', x: chartXPos[tradeLayout].lg, y: 1, w: 13, h: 456 },
        {
          i: 'balances',
          x: balancesXPos[tradeLayout].lg,
          y: 2,
          w: 13,
          h: getHeight(innerHeight, 0, 456 + marketHeaderHeight),
        },
        {
          i: 'orderbook',
          x: bookXPos[tradeLayout].lg,
          y: 0,
          w: 5,
          h: getHeight(innerHeight, 0, 0),
        },
        {
          i: 'trade-form',
          x: formXPos[tradeLayout].lg,
          y: 0,
          w: 6,
          h: getHeight(innerHeight, 0, 0),
        },
      ],
      md: [
        { i: 'market-header', x: 0, y: 0, w: 24, h: marketHeaderHeight },
        { i: 'tv-chart', x: 0, y: 1, w: 17, h: 464 },
        { i: 'balances', x: 0, y: 2, w: 17, h: 428 + marketHeaderHeight },
        { i: 'orderbook', x: 18, y: 2, w: 7, h: 428 + marketHeaderHeight },
        { i: 'trade-form', x: 18, y: 1, w: 7, h: 492 + marketHeaderHeight },
      ],
    }
  }, [height])

  return showMobileView ? (
    <MobileTradeAdvancedPage />
  ) : (
    <>
      <FavoriteMarketsBar />
      <ResponsiveGridLayout
        onBreakpointChange={(bp) => console.log('bp: ', bp)}
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
            <TradingChartContainer />
          </div>
        </div>
        <div key="balances">
          <TradeInfoTabs />
        </div>
        <div
          className={`border-y border-l border-th-bkg-3 lg:border-b-0 ${
            tradeLayout === 'chartMiddleOBRight' ? 'lg:border-r' : ''
          } ${tradeLayout !== 'chartMiddleOBLeft' ? 'lg:border-l-0' : ''}`}
          key="trade-form"
        >
          <AdvancedTradeForm />
        </div>
        <div
          key="orderbook"
          className={`overflow-hidden border-l border-th-bkg-3 lg:border-t lg:border-r ${
            tradeLayout === 'chartMiddleOBRight' ? 'lg:border-r-0' : ''
          } ${tradeLayout === 'chartMiddleOBLeft' ? 'lg:border-l-0' : ''}`}
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
