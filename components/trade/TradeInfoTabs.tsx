import { useEffect, useMemo, useState } from 'react'
import TabButtons from '@components/shared/TabButtons'
import SwapTradeBalances from '../shared/BalancesTable'
import UnsettledTrades from './UnsettledTrades'
import mangoStore from '@store/mangoStore'
import { useUnsettledSpotBalances } from 'hooks/useUnsettledSpotBalances'
import PerpPositions from './PerpPositions'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import useUnsettledPerpPositions from 'hooks/useUnsettledPerpPositions'
import TradeHistory from './TradeHistory'
import useOpenPerpPositions from 'hooks/useOpenPerpPositions'
import ManualRefresh from '@components/shared/ManualRefresh'
import AccountOrders from '@components/account/AccountOrders'

const TradeInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('balances')
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const selectedMarketName = mangoStore((s) => s.selectedMarket.current?.name)
  const unsettledSpotBalances = useUnsettledSpotBalances()
  const unsettledPerpPositions = useUnsettledPerpPositions()
  const { openPerpPositions } = useOpenPerpPositions()
  const { isMobile, isTablet, width } = useViewport()
  const fillTabWidth = width ? width < breakpoints['2xl'] : false

  useEffect(() => {
    if (selectedMarketName && selectedMarketName.includes('PERP')) {
      setSelectedTab('trade:positions')
    }
  }, [selectedMarketName])

  const tabsWithCount: [string, number][] = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const unsettledTradeCount =
      Object.values(unsettledSpotBalances).flat().length +
      unsettledPerpPositions?.length

    const stopOrdersCount =
      mangoAccount?.tokenConditionalSwaps.filter((tcs) => tcs.isConfigured)
        ?.length || 0

    return [
      ['balances', 0],
      ['trade:positions', openPerpPositions.length],
      [
        'trade:orders',
        Object.values(openOrders).flat().length + stopOrdersCount,
      ],
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
    <div className="h-full">
      <div className="hide-scroll flex w-full items-center overflow-x-auto border-b border-th-bkg-3 lg:fixed lg:top-0 lg:z-10">
        <div className="w-full md:w-auto md:border-r md:border-th-bkg-3 lg:w-full">
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
          hideBg={isMobile || isTablet}
          size={isTablet ? 'large' : 'small'}
        />
      </div>
      <div className="thin-scroll overflow-y-auto md:h-[calc(100%-48px)] lg:relative lg:top-12">
        <TabContent selectedTab={selectedTab} />
      </div>
    </div>
  )
}

export default TradeInfoTabs

const TabContent = ({ selectedTab }: { selectedTab: string }) => {
  switch (selectedTab) {
    case 'balances':
      return <SwapTradeBalances />
    case 'trade:orders':
      return <AccountOrders />
    case 'trade:unsettled':
      return <UnsettledTrades />
    case 'trade:positions':
      return <PerpPositions />
    case 'trade-history':
      return <TradeHistory />
    default:
      return <SwapTradeBalances />
  }
}
