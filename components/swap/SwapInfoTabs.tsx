import { useMemo, useState } from 'react'
import TabButtons from '@components/shared/TabButtons'
import SwapTradeBalances from '../shared/BalancesTable'
import mangoStore from '@store/mangoStore'
import SwapHistoryTable from './SwapHistoryTable'
import useMangoAccount from 'hooks/useMangoAccount'

const SwapInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('balances')
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const { mangoAccount } = useMangoAccount()
  const swapHistory = mangoStore((s) => s.mangoAccount.stats.swapHistory.data)
  const loading = mangoStore((s) => s.mangoAccount.stats.swapHistory.loading)

  const tabsWithCount: [string, number][] = useMemo(() => {
    return [
      ['balances', 0],
      ['swap:swap-history', 0],
    ]
  }, [openOrders, mangoAccount])

  return (
    <div className="hide-scroll h-full overflow-y-scroll">
      <div className="sticky top-0 z-10 border-b border-th-bkg-3">
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
    </div>
  )
}

export default SwapInfoTabs
