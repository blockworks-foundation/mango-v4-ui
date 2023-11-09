import { useEffect, useState } from 'react'
import PerpMarketsTable from './PerpMarketsTable'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import mangoStore from '@store/mangoStore'
import ButtonGroup from '@components/forms/ButtonGroup'
import RecentGainersLosers from './RecentGainersLosers'
import Spot from './Spot'
dayjs.extend(relativeTime)

const EXPLORE_TABS = ['markets', 'accounts']
const MARKET_TABS = ['spot', 'perp']

const Explore = () => {
  const { t } = useTranslation(['common'])
  const perpStats = mangoStore((s) => s.perpStats.data)
  const [activeExploreTab, setActiveExploreTab] = useState('markets')
  const [activeMarketTab, setActiveMarketTab] = useState('spot')

  useEffect(() => {
    if (!perpStats || !perpStats.length) {
      const actions = mangoStore.getState().actions
      actions.fetchPerpStats()
    }
  }, [perpStats])

  return (
    <>
      <div className="px-4 pt-8 md:px-6">
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-4">
          <h2 className="text-center text-lg md:text-left xl:text-xl">
            {t('explore')}
          </h2>
          <div className="md:w-[164px]">
            <ButtonGroup
              activeValue={activeExploreTab}
              onChange={(t) => setActiveExploreTab(t)}
              names={EXPLORE_TABS.map((tab) => t(tab))}
              values={EXPLORE_TABS}
            />
          </div>
        </div>
      </div>
      <RecentGainersLosers />
      <div className="mb-6 flex flex-col px-4 pt-8 md:mb-0 md:flex-row md:items-center md:space-x-4 md:px-6">
        <h2 className="mb-3 text-center text-lg md:mb-0 md:text-left xl:text-xl">
          {t('markets')}
        </h2>
        <div className="mx-auto max-w-[112px]">
          <ButtonGroup
            activeValue={activeMarketTab}
            onChange={(t) => setActiveMarketTab(t)}
            names={MARKET_TABS.map((tab) => t(tab))}
            values={MARKET_TABS}
          />
        </div>
      </div>
      <TabContent activeTab={activeMarketTab} />
    </>
  )
}

export default Explore

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'spot':
      return <Spot />
    case 'perp':
      return (
        <div className="mt-6 border-t border-th-bkg-3">
          <PerpMarketsTable />
        </div>
      )
    default:
      return <Spot />
  }
}
