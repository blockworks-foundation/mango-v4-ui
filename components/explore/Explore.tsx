import { useEffect, useMemo, useState } from 'react'
import PerpMarketsTable from './PerpMarketsTable'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import mangoStore from '@store/mangoStore'
import RecentGainersLosers from './RecentGainersLosers'
import Spot from './Spot'
import useBanks from 'hooks/useBanks'
import TabsText from '@components/shared/TabsText'
dayjs.extend(relativeTime)

const Explore = () => {
  const { t } = useTranslation(['common'])
  const { banks } = useBanks()
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
    const tabs: [string, number][] = [
      ['tokens', banks.length],
      ['perp-markets', perpMarkets.length],
    ]
    return tabs
  }, [banks])

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
            className="text-lg"
          />
        </div>
      </div>
      <TabContent activeTab={activeTab} />
    </>
  )
}

export default Explore

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'tokens':
      return <Spot />
    case 'perp-markets':
      return (
        <div className="mt-6 border-t border-th-bkg-3">
          <PerpMarketsTable />
        </div>
      )
    default:
      return <Spot />
  }
}
