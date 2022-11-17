import { useMemo, useState } from 'react'
import TabButtons from '@components/shared/TabButtons'
import SwapTradeBalances from '../shared/BalancesTable'
import UnsettledTrades from '../trade/UnsettledTrades'
import mangoStore from '@store/mangoStore'
import SwapHistoryTable from './SwapHistoryTable'
import { useUnsettledSpotBalances } from 'hooks/useUnsettledSpotBalances'

const SwapInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('balances')
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const swapHistory = mangoStore((s) => s.mangoAccount.stats.swapHistory.data)
  const loading = mangoStore((s) => s.mangoAccount.stats.swapHistory.loading)
  const unsettledSpotBalances = useUnsettledSpotBalances()

  const tabsWithCount: [string, number][] = useMemo(() => {
    return [
      ['balances', 0],
      ['swap:swap-history', 0],
      ['trade:unsettled', Object.values(unsettledSpotBalances).flat().length],
    ]
  }, [openOrders, mangoAccount])

  return (
    <div className="hide-scroll h-full overflow-y-scroll">
      <div className="sticky top-0 z-10">
        <TabButtons
          activeValue={selectedTab}
          onChange={(tab: string) => setSelectedTab(tab)}
          values={tabsWithCount}
          showBorders
        />
      </div>
      {selectedTab === 'balances' ? <SwapTradeBalances /> : null}
      {selectedTab === 'swap:swap-history' ? (
        <SwapHistoryTable swapHistory={swapHistory} loading={loading} />
      ) : null}
      {selectedTab === 'trade:unsettled' ? (
        <UnsettledTrades unsettledSpotBalances={unsettledSpotBalances} />
      ) : null}
    </div>
  )
}

export default SwapInfoTabs
