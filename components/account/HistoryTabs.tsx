import { useEffect, useState } from 'react'
import SwapHistoryTable from '../swap/SwapHistoryTable'
import TradeHistory from '@components/trade/TradeHistory'
import { useTranslation } from 'next-i18next'
import ActivityFilters from './ActivityFilters'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import ActivityFeedTable from './ActivityFeedTable'

const TABS = ['activity:activity-feed', 'activity:swaps', 'activity:trades']

const HistoryTabs = () => {
  const { t } = useTranslation(['common', 'activity'])
  const [activeTab, setActiveTab] = useState('activity:activity-feed')
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
              className={`default-transition rounded-md py-1.5 px-2.5 text-sm font-medium focus:bg-th-bkg-4 focus:text-th-fgd-1 md:hover:bg-th-bkg-4 ${
                activeTab === tab
                  ? 'bg-th-bkg-4 text-th-active'
                  : 'text-th-fgd-3'
              }`}
              onClick={() => setActiveTab(tab)}
              key={tab}
            >
              {t(tab)}
            </button>
          ))}
        </div>
        {activeTab === 'activity:activity-feed' ? <ActivityFilters /> : null}
      </div>
      <TabContent activeTab={activeTab} />
    </>
  )
}

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'activity:activity-feed':
      return <ActivityFeedTable />
    case 'activity:swaps':
      return <SwapHistoryTable />
    case 'activity:trades':
      return <TradeHistory />
    default:
      return <ActivityFeedTable />
  }
}

export default HistoryTabs
