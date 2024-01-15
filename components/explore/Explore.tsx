import { useEffect, useMemo, useState } from 'react'
import PerpMarketsTable from './PerpMarketsTable'
import { useTranslation } from 'react-i18next'
import mangoStore from '@store/mangoStore'
import RecentGainersLosers from './RecentGainersLosers'
import Spot from './Spot'
import useBanks from 'hooks/useBanks'
import TabsText from '@components/shared/TabsText'
import useFollowedAccounts from 'hooks/useFollowedAccounts'
import FollowedAccounts from './FollowedAccounts'

const Explore = () => {
  const { t } = useTranslation(['common'])
  const { banks } = useBanks()
  const { data: followedAccounts } = useFollowedAccounts()
  const perpStats = mangoStore((s) => s.perpStats.data)
  const [activeTab, setActiveTab] = useState('tokens')

  useEffect(() => {
    if (!perpStats || !perpStats.length) {
      const actions = mangoStore.getState().actions
      actions.fetchPerpStats()
    }
  }, [perpStats])

  const tabsWithCount: [string, number][] = useMemo(() => {
    const perpMarkets = mangoStore.getState().perpMarkets
    const followedAccountsNumber = followedAccounts
      ? followedAccounts.length
      : 0
    const tabs: [string, number][] = [
      ['tokens', banks.length],
      ['perp', perpMarkets.length],
      ['account:followed-accounts', followedAccountsNumber],
    ]
    return tabs
  }, [banks, followedAccounts])

  return (
    <>
      <div className="px-4 pt-10 md:px-6">
        <h2 className="mb-4 text-center text-lg md:text-left">
          {t('explore')}
        </h2>
      </div>
      <RecentGainersLosers />
      <div className="z-10 w-max px-4 pt-8 md:px-6">
        <div
          className={`flex h-10 flex-col items-center justify-end md:items-start ${
            activeTab === 'tokens' ? 'mb-4 lg:mb-0' : ''
          }`}
        >
          <TabsText
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={tabsWithCount}
            className="xl:text-lg"
          />
        </div>
      </div>
      <div className="pb-20 md:pb-0">
        <TabContent activeTab={activeTab} />
      </div>
    </>
  )
}

export default Explore

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'tokens':
      return <Spot />
    case 'perp':
      return (
        <div className="mt-6 border-t border-th-bkg-3">
          <PerpMarketsTable />
        </div>
      )
    case 'account:followed-accounts':
      return <FollowedAccounts />
    default:
      return <Spot />
  }
}
