import { useMemo, useState } from 'react'
import TabButtons from '@components/shared/TabButtons'
import OpenOrders from './OpenOrders'
import Balances from './TradeBalances'
import UnsettledTrades from './UnsettledTrades'
import mangoStore from '@store/mangoStore'

const TradeInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('Balances')
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)

  const tabsWithCount: [string, number][] = useMemo(() => {
    return [
      ['Balances', 0],
      ['Orders', Object.values(openOrders).flat().length],
      ['Unsettled', 0],
    ]
  }, [openOrders])

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
