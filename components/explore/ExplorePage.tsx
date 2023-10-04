import useListedMarketsWithMarketData from 'hooks/useListedMarketsWithMarketData'
import { useEffect, useMemo, useState } from 'react'
import PerpMarketsTable from './PerpMarketsTable'
import { useRouter } from 'next/router'
import TokenPage from '@components/token/TokenPage'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Spot from './Spot'
import mangoStore from '@store/mangoStore'
import PerpStatsPage from '@components/stats/perps/PerpStatsPage'
dayjs.extend(relativeTime)

const ExplorePage = () => {
  const { t } = useTranslation(['common'])
  const router = useRouter()
  const { token } = router.query
  const { market } = router.query
  const perpStats = mangoStore((s) => s.perpStats.data)
  const initialStatsLoad = mangoStore((s) => s.tokenStats.initialLoad)
  const [activeTab, setActiveTab] = useState('spot')
  const { perpMarketsWithData, serumMarketsWithData } =
    useListedMarketsWithMarketData()

  const tabsWithCount: [string, number][] = useMemo(() => {
    const tabs: [string, number][] = [
      ['spot', serumMarketsWithData.length],
      ['perp', perpMarketsWithData.length],
      //   ['accounts', 0],
    ]
    return tabs
  }, [perpMarketsWithData, serumMarketsWithData])

  useEffect(() => {
    if (!perpStats || !perpStats.length) {
      const actions = mangoStore.getState().actions
      actions.fetchPerpStats()
    }
  }, [perpStats])

  useEffect(() => {
    if (!initialStatsLoad) {
      const actions = mangoStore.getState().actions
      actions.fetchTokenStats()
    }
  }, [initialStatsLoad])

  return market ? (
    <PerpStatsPage />
  ) : token ? (
    <TokenPage />
  ) : (
    <div className="pb-[27px]">
      <div>
        <div className="flex flex-col items-center py-8">
          <h1 className="mb-4">{t('explore')}</h1>
          <div className="flex justify-center">
            {tabsWithCount.map((tab) => (
              <button
                className={`flex items-center space-x-2 border-y-2 border-r-2 border-th-bkg-3 px-6 py-3 font-display text-base first:rounded-l-lg first:border-l-2 last:rounded-r-lg focus:outline-none ${
                  activeTab === tab[0] ? 'bg-th-bkg-2 text-th-active' : ''
                }`}
                onClick={() => setActiveTab(tab[0])}
                key={tab[0]}
              >
                <span>{t(tab[0])}</span>
                <div className="rounded-md bg-th-bkg-3 px-1 py-0.5 font-body text-xs font-medium text-th-fgd-3">
                  <span>{tab[1]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <TabContent activeTab={activeTab} />
    </div>
  )
}

export default ExplorePage

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'spot':
      return <Spot />
    case 'perp':
      return (
        <div className="border-t border-th-bkg-3">
          <PerpMarketsTable />
        </div>
      )
    default:
      return <Spot />
  }
}
