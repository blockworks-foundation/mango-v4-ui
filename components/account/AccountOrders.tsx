import TabsText from '@components/shared/TabsText'
import SwapOrders from '@components/swap/SwapTriggerOrders'
import OpenOrders from '@components/trade/OpenOrders'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import { useMemo, useState } from 'react'

const AccountOrders = () => {
  const { mangoAccount } = useMangoAccount()
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const [activeTab, setActiveTab] = useState('trade:limit')

  const tabsWithCount: [string, number][] = useMemo(() => {
    const stopOrdersCount =
      mangoAccount?.tokenConditionalSwaps.filter((tcs) => tcs.isConfigured)
        ?.length || 0
    const tabs: [string, number][] = [
      ['trade:limit', Object.values(openOrders).flat().length],
      ['trade:trigger-orders', stopOrdersCount],
    ]
    return tabs
  }, [mangoAccount, openOrders])

  return (
    <>
      <div className="px-4 py-4 md:px-6">
        <TabsText
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={tabsWithCount}
        />
      </div>
      <div className="flex flex-1 flex-col border-t border-th-bkg-3">
        {activeTab === 'trade:limit' ? <OpenOrders /> : <SwapOrders />}
      </div>
    </>
  )
}

export default AccountOrders
