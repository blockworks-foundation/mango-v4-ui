import { useEffect, useMemo, useState } from 'react'
import TabButtons from '@components/shared/TabButtons'
import OpenOrders from './OpenOrders'
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

const TradeInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('balances')
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const selectedMarketName = mangoStore((s) => s.selectedMarket.current?.name)
  const unsettledSpotBalances = useUnsettledSpotBalances()
  const unsettledPerpPositions = useUnsettledPerpPositions()
  const openPerpPositions = useOpenPerpPositions()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints['2xl'] : false

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
      <div className="hide-scroll overflow-x-auto border-b border-th-bkg-3">
        <TabButtons
          activeValue={selectedTab}
          onChange={(tab: string) => setSelectedTab(tab)}
          values={tabsWithCount}
          showBorders
          fillWidth={isMobile}
        />
      </div>
      {selectedTab === 'balances' ? <SwapTradeBalances /> : null}
      {selectedTab === 'trade:orders' ? <OpenOrders /> : null}
      {selectedTab === 'trade:unsettled' ? (
        <UnsettledTrades
          unsettledSpotBalances={unsettledSpotBalances}
          unsettledPerpPositions={unsettledPerpPositions}
        />
      ) : null}
      {selectedTab === 'trade:positions' ? <PerpPositions /> : null}
      {selectedTab === 'trade-history' ? <TradeHistory /> : null}
    </div>
  )
}

export default TradeInfoTabs
