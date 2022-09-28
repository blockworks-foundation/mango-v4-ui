import { useMemo, useState } from 'react'
import TabButtons from '@components/shared/TabButtons'
import OpenOrders from './OpenOrders'
import Balances from './TradeBalances'
import UnsettledTrades from './UnsettledTrades'

const TABS = ['Balances', 'Orders', 'Unsettled P&L']

const TradeInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('Balances')

  const tabsWithCount: [string, number][] = useMemo(() => {
    return TABS.map((t) => [t, 0])
  }, [])

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
      {selectedTab === 'Balances' ? <Balances /> : null}
      {selectedTab === 'Orders' ? <OpenOrders /> : null}
      {selectedTab === 'Unsettled' ? <UnsettledTrades /> : null}
    </div>
  )
}

export default TradeInfoTabs
