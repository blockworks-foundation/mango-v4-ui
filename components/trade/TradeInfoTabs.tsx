import { useMemo, useState } from 'react'
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

const TradeInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('balances')
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)
  const unsettledSpotBalances = useUnsettledSpotBalances()
  const unsettledPerpPositions = useUnsettledPerpPositions()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.lg : false

  const tabsWithCount: [string, number][] = useMemo(() => {
    const unsettledTradeCount =
      Object.values(unsettledSpotBalances).flat().length +
      unsettledPerpPositions?.length
    const openPerpPositions = Object.values(perpPositions).filter((p) =>
      p.basePositionLots.toNumber()
    )
    return [
      ['balances', 0],
      ['trade:orders', Object.values(openOrders).flat().length],
      ['trade:unsettled', unsettledTradeCount],
      ['Positions', openPerpPositions.length],
      ['Trade History', 0],
    ]
  }, [openOrders, unsettledPerpPositions, unsettledSpotBalances, perpPositions])

  return (
    <div className="hide-scroll h-full overflow-y-scroll pb-5">
      <div className="hide-scroll sticky top-0 z-10 overflow-x-auto border-b border-th-bkg-3">
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
      {selectedTab === 'Positions' ? <PerpPositions /> : null}
      {selectedTab === 'Trade History' ? <TradeHistory /> : null}
    </div>
  )
}

export default TradeInfoTabs
