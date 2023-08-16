import { useMemo, useState } from 'react'
import TabButtons from '@components/shared/TabButtons'
import SwapTradeBalances from '../shared/BalancesTable'
import SwapHistoryTable from './SwapHistoryTable'
import useMangoAccount from 'hooks/useMangoAccount'
import ManualRefresh from '@components/shared/ManualRefresh'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import SwapOrders from './SwapOrders'
import { useIsWhiteListed } from 'hooks/useIsWhiteListed'

const SwapInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('balances')
  const { mangoAccount } = useMangoAccount()
  const { width } = useViewport()
  const { data: isWhiteListed } = useIsWhiteListed()
  const isMobile = width ? width < breakpoints.lg : false

  const tabsWithCount: [string, number][] = useMemo(() => {
    const tabs: [string, number][] = [
      ['balances', 0],
      ['swap:swap-history', 0],
    ]
    if (isWhiteListed) {
      const stopOrdersCount =
        mangoAccount?.tokenConditionalSwaps.filter((tcs) => tcs.hasData)
          ?.length || 0
      tabs.splice(1, 0, ['trade:trigger-orders', stopOrdersCount])
    }
    return tabs
  }, [isWhiteListed, mangoAccount])

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
      {selectedTab === 'trade:trigger-orders' ? <SwapOrders /> : null}
      {selectedTab === 'swap:swap-history' ? <SwapHistoryTable /> : null}
    </div>
  )
}

export default SwapInfoTabs
