import { useEffect, useMemo, useState } from 'react'
import TabButtons from '@components/shared/TabButtons'
import OpenOrders from './OpenOrders'
import SwapTradeBalances from '../shared/BalancesTable'
import UnsettledTrades from './UnsettledTrades'
import mangoStore from '@store/mangoStore'
import { useUnsettledSpotBalances } from 'hooks/useUnsettledSpotBalances'
import PerpPositions from './PerpPositions'
import { useViewport } from '@components/ViewportProvider'
import { breakpoints } from 'utils/theme'
import useUnsettledPerpPositions from 'hooks/useUnsettledPerpPositions'
import TradeHistory from './TradeHistory'
import useOpenPerpPositions from 'hooks/useOpenPerpPositions'
import ManualRefresh from '@components/shared/ManualRefresh'

const TradeInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('balances')
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const selectedMarketName = mangoStore((s) => s.selectedMarket.current?.name)
  const unsettledSpotBalances = useUnsettledSpotBalances()
  const unsettledPerpPositions = useUnsettledPerpPositions()
  const openPerpPositions = useOpenPerpPositions()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  const fillTabWidth = width ? width < breakpoints['2xl'] : false

  useEffect(() => {
    if (selectedMarketName && selectedMarketName.includes('PERP')) {
      setSelectedTab('trade:positions')
    }
  }, [selectedMarketName])

  const tabsWithCount: [string, number][] = useMemo(() => {
    const unsettledTradeCount =
      Object.values(unsettledSpotBalances).flat().length +
      unsettledPerpPositions?.length
    return [
      ['balances', 0],
      ['trade:positions', openPerpPositions.length],
      ['trade:orders', Object.values(openOrders).flat().length],
      ['trade:unsettled', unsettledTradeCount],
      ['trade-history', 0],
    ]
  }, [
    openOrders,
    unsettledPerpPositions,
    unsettledSpotBalances,
    openPerpPositions,
  ])

  return (
    <div className="hide-scroll h-full overflow-y-scroll">
      <div className="hide-scroll flex items-center overflow-x-auto border-b border-th-bkg-3">
        <div className="md:border-r md:border-th-bkg-3 lg:w-full">
          <TabButtons
            activeValue={selectedTab}
            onChange={(tab: string) => setSelectedTab(tab)}
            values={tabsWithCount}
            showBorders
            fillWidth={fillTabWidth}
          />
        </div>
        <ManualRefresh
          classNames="fixed bottom-16 right-4 md:relative md:px-2 md:bottom-0 md:right-0 z-10 shadow-lg md:shadow-none bg-th-bkg-3 md:bg-transparent"
          hideBg={isMobile}
          size={isMobile ? 'large' : 'small'}
        />
      </div>
      <TabContent selectedTab={selectedTab} />
    </div>
  )
}

export default TradeInfoTabs

const TabContent = ({ selectedTab }: { selectedTab: string }) => {
  const unsettledSpotBalances = useUnsettledSpotBalances()
  const unsettledPerpPositions = useUnsettledPerpPositions()
  switch (selectedTab) {
    case 'balances':
      return <SwapTradeBalances />
    case 'trade:orders':
      return <OpenOrders />
    case 'trade:unsettled':
      return (
        <UnsettledTrades
          unsettledSpotBalances={unsettledSpotBalances}
          unsettledPerpPositions={unsettledPerpPositions}
        />
      )
    case 'trade:positions':
      return <PerpPositions />
    case 'trade-history':
      return <TradeHistory />
    default:
      return <SwapTradeBalances />
  }
}
