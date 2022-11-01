import { useMemo, useState } from 'react'
import TabButtons from '@components/shared/TabButtons'
import OpenOrders from './OpenOrders'
import SwapTradeBalances from '../shared/SwapTradeBalances'
import UnsettledTrades from './UnsettledTrades'
import mangoStore from '@store/mangoStore'
import { useUnsettledSpotBalances } from 'hooks/useUnsettledSpotBalances'
import PerpPositions from './PerpPositions'

const TradeInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('balances')
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)
  const unsettledSpotBalances = useUnsettledSpotBalances()

  const tabsWithCount: [string, number][] = useMemo(() => {
    return [
      ['balances', 0],
      ['trade:orders', Object.values(openOrders).flat().length],
      ['trade:unsettled', Object.values(unsettledSpotBalances).flat().length],
      ['Perp Positions', perpPositions.length],
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
        />
      </div>
      {selectedTab === 'balances' ? <SwapTradeBalances /> : null}
      {selectedTab === 'trade:orders' ? <OpenOrders /> : null}
      {selectedTab === 'trade:unsettled' ? (
        <UnsettledTrades unsettledSpotBalances={unsettledSpotBalances} />
      ) : null}
      {selectedTab === 'Perp Positions' ? <PerpPositions /> : null}
    </div>
  )
}

export default TradeInfoTabs
