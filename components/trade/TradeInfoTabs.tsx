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

const TradeInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('balances')
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)
  const unsettledSpotBalances = useUnsettledSpotBalances()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.lg : false

  const tabsWithCount: [string, number][] = useMemo(() => {
    const unsettledTradeCount =
      Object.values(unsettledSpotBalances).flat().length +
      perpPositions.filter((p) => !p.basePositionLots.toNumber())?.length
    return [
      ['balances', 0],
      ['trade:orders', Object.values(openOrders).flat().length],
      ['trade:unsettled', unsettledTradeCount],
      [
        'Positions',
        perpPositions.filter((p) => p.basePositionLots.toNumber())?.length,
      ],
    ]
  }, [openOrders, perpPositions, unsettledSpotBalances])

  return (
    <div className="hide-scroll h-full overflow-y-scroll pb-5">
      <div className="sticky top-0 z-10">
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
          unsettledPerpPositions={perpPositions.filter(
            (p) => !p.basePositionLots.toNumber()
          )}
        />
      ) : null}
      {selectedTab === 'Positions' ? <PerpPositions /> : null}
    </div>
  )
}

export default TradeInfoTabs
