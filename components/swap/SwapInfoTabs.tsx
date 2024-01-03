import { useEffect, useMemo, useState } from 'react'
import TabButtons from '@components/shared/TabButtons'
import SwapTradeBalances from '../shared/BalancesTable'
import SwapHistoryTable from './SwapHistoryTable'
import useMangoAccount from 'hooks/useMangoAccount'
import ManualRefresh from '@components/shared/ManualRefresh'
import { useViewport } from 'hooks/useViewport'
import SwapTriggerOrders from './SwapTriggerOrders'
import mangoStore from '@store/mangoStore'

const SwapInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('balances')
  const { mangoAccount } = useMangoAccount()
  const { isMobile, isTablet } = useViewport()
  const { swapOrTrigger } = mangoStore((s) => s.swap)

  const tabsWithCount: [string, number][] = useMemo(() => {
    const tabs: [string, number][] = [
      ['balances', 0],
      ['swap:swap-history', 0],
    ]
    const stopOrdersCount =
      mangoAccount?.tokenConditionalSwaps.filter((tcs) => tcs.isConfigured)
        ?.length || 0
    tabs.splice(1, 0, ['trade:trigger-orders', stopOrdersCount])
    return tabs
  }, [mangoAccount])

  useEffect(() => {
    if (swapOrTrigger !== 'swap') {
      setSelectedTab('trade:trigger-orders')
    } else {
      if (selectedTab !== 'balances') {
        setSelectedTab('balances')
      }
    }
  }, [swapOrTrigger])

  return (
    <div className="hide-scroll h-full overflow-y-scroll">
      <div className="flex items-center border-b border-th-bkg-3">
        <div className="w-full md:border-r md:border-th-bkg-3">
          <TabButtons
            activeValue={selectedTab}
            onChange={(tab: string) => setSelectedTab(tab)}
            values={tabsWithCount}
            showBorders
          />
        </div>
        <ManualRefresh
          classNames="fixed bottom-16 right-4 md:relative md:px-2 md:bottom-0 md:right-0 z-10 shadow-lg md:shadow-none bg-th-bkg-3 md:bg-transparent"
          hideBg={isMobile || isTablet}
          size={isTablet ? 'large' : 'small'}
        />
      </div>
      {selectedTab === 'balances' ? <SwapTradeBalances /> : null}
      {selectedTab === 'trade:trigger-orders' ? <SwapTriggerOrders /> : null}
      {selectedTab === 'swap:swap-history' ? <SwapHistoryTable /> : null}
    </div>
  )
}

export default SwapInfoTabs
