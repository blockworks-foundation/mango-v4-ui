import TabButtons from '@components/shared/TabButtons'
import mangoStore, { TokenStatsItem } from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { formatYAxis } from 'utils/formatting'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

const ChartTabs = ({ token }: { token: string }) => {
  const { t } = useTranslation('token')
  const [activeDepositsTab, setActiveDepositsTab] = useState('token:deposits')
  const [activeBorrowsTab, setActiveBorrowsTab] = useState('token:borrows')
  const [depositDaysToShow, setDepositDaysToShow] = useState('30')
  const [borrowDaysToShow, setBorrowDaysToShow] = useState('30')
  const [depositRateDaysToShow, setDepositRateDaysToShow] = useState('30')
  const [borrowRateDaysToShow, setBorrowRateDaysToShow] = useState('30')
  const tokenStats = mangoStore((s) => s.tokenStats.data)
  const initialStatsLoad = mangoStore((s) => s.tokenStats.initialLoad)
  const loadingTokenStats = mangoStore((s) => s.tokenStats.loading)
  const actions = mangoStore.getState().actions
  const { group } = useMangoGroup()

  useEffect(() => {
    if (group && !initialStatsLoad) {
      actions.fetchTokenStats()
    }
  }, [group])

  const statsHistory = useMemo(() => {
    if (!tokenStats?.length) return []
    return tokenStats.reduce((a: TokenStatsItem[], c: TokenStatsItem) => {
      if (c.symbol === token) {
        const copy = { ...c }
        copy.deposit_apr = copy.deposit_apr * 100
        copy.borrow_apr = copy.borrow_apr * 100
        a.push(copy)
      }
      return a.sort(
        (a, b) =>
          new Date(a.date_hour).getTime() - new Date(b.date_hour).getTime()
      )
    }, [])
  }, [tokenStats])

  // const filterStats = (daysToShow: string) => {
  //   if (!statsHistory.length) return []
  //   if (daysToShow !== '30') {
  //     const seconds = Number(daysToShow) * 86400
  //     const data = statsHistory.filter((d) => {
  //       const dataTime = new Date(d.date_hour).getTime() / 1000
  //       const now = new Date().getTime() / 1000
  //       const limit = now - seconds
  //       return dataTime >= limit
  //     })
  //     return data
  //   }
  //   return statsHistory
  // }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      <div className="col-span-1 border-b border-th-bkg-3 md:border-r md:border-b-0">
        <div className="w-full">
          <TabButtons
            activeValue={activeDepositsTab}
            onChange={(v) => setActiveDepositsTab(v)}
            showBorders
            values={[
              ['token:deposits', 0],
              ['token:deposit-rates', 0],
            ]}
          />
          <div className="h-96 border-t border-th-bkg-3 px-6 py-6">
            {activeDepositsTab === 'token:deposits' ? (
              <DetailedAreaChart
                data={statsHistory}
                daysToShow={depositDaysToShow}
                setDaysToShow={setDepositDaysToShow}
                heightClass="h-64"
                loaderHeightClass="h-[334px]"
                domain={[0, 'dataMax']}
                loading={loadingTokenStats}
                small
                tickFormat={(x) => formatYAxis(x)}
                title={`${token} ${t('token:deposits')}`}
                xKey="date_hour"
                yKey={'total_deposits'}
              />
            ) : (
              <DetailedAreaChart
                data={statsHistory}
                daysToShow={depositRateDaysToShow}
                setDaysToShow={setDepositRateDaysToShow}
                heightClass="h-64"
                loaderHeightClass="h-[334px]"
                // domain={[0, 'dataMax']}
                loading={loadingTokenStats}
                hideChange
                small
                suffix="%"
                tickFormat={(x) => `${x.toFixed(2)}%`}
                title={`${token} ${t('token:deposit-rates')} APR`}
                xKey="date_hour"
                yKey={'deposit_apr'}
              />
            )}
          </div>
        </div>
      </div>
      <div className="col-span-1">
        <div className="w-full">
          <TabButtons
            activeValue={activeBorrowsTab}
            onChange={(v) => setActiveBorrowsTab(v)}
            showBorders
            values={[
              ['token:borrows', 0],
              ['token:borrow-rates', 0],
            ]}
          />
          <div className="h-96 border-t border-th-bkg-3 px-6 py-6">
            {activeBorrowsTab === 'token:borrows' ? (
              <DetailedAreaChart
                data={statsHistory}
                daysToShow={borrowDaysToShow}
                setDaysToShow={setBorrowDaysToShow}
                heightClass="h-64"
                loaderHeightClass="h-[334px]"
                domain={[0, 'dataMax']}
                loading={loadingTokenStats}
                small
                tickFormat={(x) => formatYAxis(x)}
                title={`${token} ${t('token:borrows')}`}
                xKey="date_hour"
                yKey={'total_borrows'}
              />
            ) : (
              <DetailedAreaChart
                data={statsHistory}
                daysToShow={borrowRateDaysToShow}
                setDaysToShow={setBorrowRateDaysToShow}
                heightClass="h-64"
                loaderHeightClass="h-[334px]"
                // domain={[0, 'dataMax']}
                loading={loadingTokenStats}
                small
                hideChange
                suffix="%"
                tickFormat={(x) => `${x.toFixed(2)}%`}
                title={`${token} ${t('token:borrow-rates')} APR`}
                xKey="date_hour"
                yKey={'borrow_apr'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartTabs
