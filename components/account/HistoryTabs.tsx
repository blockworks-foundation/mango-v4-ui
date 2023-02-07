import { useEffect, useState } from 'react'
import SwapHistoryTable from '../swap/SwapHistoryTable'
import ActivityFeed from './ActivityFeed'
import TradeHistory from '@components/trade/TradeHistory'
import { useTranslation } from 'next-i18next'
import ActivityFilters from './ActivityFilters'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'

const TABS = ['activity:activity', 'activity:swaps', 'activity:trades']

const HistoryTabs = () => {
  const { t } = useTranslation(['common', 'activity'])
  const [activeTab, setActiveTab] = useState('activity:activity')
  const actions = mangoStore((s) => s.actions)
  const { mangoAccountAddress } = useMangoAccount()

  useEffect(() => {
    if (actions && mangoAccountAddress) {
      actions.fetchActivityFeed(mangoAccountAddress)
    }
  }, [actions, mangoAccountAddress])

  return (
    <>
      <div className="relative flex h-14 items-center justify-between bg-th-bkg-2">
        <div className="hide-scroll flex space-x-2 pl-4 md:pl-6">
          {TABS.map((tab) => (
            <button
              className={`default-transition rounded-md py-1.5 px-2.5 text-sm font-medium md:hover:bg-th-bkg-4 ${
                activeTab === tab
                  ? 'bg-th-bkg-4 text-th-active'
                  : 'bg-th-bkg-3 text-th-fgd-3'
              }`}
              onClick={() => setActiveTab(tab)}
              key={tab}
            >
              {t(tab)}
            </button>
          ))}
        </div>
        {activeTab === 'activity:activity' ? <ActivityFilters /> : null}
      </div>
      <TabContent activeTab={activeTab} />
    </>
  )
}

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'activity:activity':
      return <ActivityFeed />
    case 'activity:swaps':
      return <SwapHistoryTable />
    case 'activity:trades':
      return <TradeHistory />
    default:
      return <ActivityFeed />
  }
}

export default HistoryTabs
