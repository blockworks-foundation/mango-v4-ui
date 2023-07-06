import { useMemo, useState } from 'react'
import TabButtons from '@components/shared/TabButtons'
import SwapTradeBalances from '../shared/BalancesTable'
import mangoStore from '@store/mangoStore'
import SwapHistoryTable from './SwapHistoryTable'
import useMangoAccount from 'hooks/useMangoAccount'
import ManualRefresh from '@components/shared/ManualRefresh'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'

const SwapInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('balances')
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const { mangoAccount } = useMangoAccount()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.lg : false

  const tabsWithCount: [string, number][] = useMemo(() => {
    return [
      ['balances', 0],
      ['swap:swap-history', 0],
    ]
  }, [openOrders, mangoAccount])

  return (
    <div className="hide-scroll h-full overflow-y-scroll">
      <div className="flex items-center border-b border-th-bkg-3">
        <TabButtons
          activeValue={selectedTab}
          onChange={(tab: string) => setSelectedTab(tab)}
          values={tabsWithCount}
          showBorders
        />
        <ManualRefresh
          classNames="fixed bottom-16 right-4 lg:relative lg:bottom-0 md:bottom-6 md:right-6 z-10 shadow-lg lg:shadow-none bg-th-bkg-3 lg:bg-transparent"
          hideBg={isMobile}
          size={isMobile ? 'large' : 'small'}
        />
      </div>
      {selectedTab === 'balances' ? <SwapTradeBalances /> : null}
      {selectedTab === 'swap:swap-history' ? <SwapHistoryTable /> : null}
    </div>
  )
}

export default SwapInfoTabs
