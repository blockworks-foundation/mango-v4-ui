import TabButtons from '@components/shared/TabButtons'
import mangoStore, { TokenStatsItem } from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

const ChartTabs = ({ token }: { token: string }) => {
  const { t } = useTranslation('token')
  const [activeDepositsTab, setActiveDepositsTab] = useState('token:deposits')
  const [activeBorrowsTab, setActiveBorrowsTab] = useState('token:borrows')
  const tokenStats = mangoStore((s) => s.tokenStats.data)
  const initialStatsLoad = mangoStore((s) => s.tokenStats.initialLoad)
  const loadingTokenStats = mangoStore((s) => s.tokenStats.loading)
  const actions = mangoStore((s) => s.actions)
  const { group } = useMangoGroup()

  useEffect(() => {
    if (group && !initialStatsLoad) {
      actions.fetchTokenStats()
    }
  }, [group])

  const statsHistory = useMemo(() => {
    if (!tokenStats.length) return []
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
          <div className="px-6 py-4">
            {activeDepositsTab === 'token:deposits' ? (
              <DetailedAreaChart
                data={statsHistory}
                daysToShow={'999'}
                heightClass="h-64"
                // domain={[0, 'dataMax']}
                loading={loadingTokenStats}
                small
                tickFormat={(x) => x.toFixed(2)}
                title={`${token} ${t('token:deposits')}`}
                xKey="date_hour"
                yKey={'total_deposits'}
              />
            ) : (
              <DetailedAreaChart
                data={statsHistory}
                daysToShow={'999'}
                heightClass="h-64"
                // domain={[0, 'dataMax']}
                loading={loadingTokenStats}
                hideChange
                small
                suffix="%"
                tickFormat={(x) => `${x.toFixed(2)}%`}
                title={`${token} ${t('token:deposit-rates')} (APR)`}
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
          <div className="px-6 py-4">
            {activeBorrowsTab === 'token:borrows' ? (
              <DetailedAreaChart
                data={statsHistory}
                daysToShow={'999'}
                heightClass="h-64"
                // domain={[0, 'dataMax']}
                loading={loadingTokenStats}
                small
                tickFormat={(x) => x.toFixed(2)}
                title={`${token} ${t('token:borrows')}`}
                xKey="date_hour"
                yKey={'total_borrows'}
              />
            ) : (
              <DetailedAreaChart
                data={statsHistory}
                daysToShow={'999'}
                heightClass="h-64"
                // domain={[0, 'dataMax']}
                loading={loadingTokenStats}
                small
                hideChange
                suffix="%"
                tickFormat={(x) => `${x.toFixed(2)}%`}
                title={`${token} ${t('token:borrow-rates')} (APR)`}
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
