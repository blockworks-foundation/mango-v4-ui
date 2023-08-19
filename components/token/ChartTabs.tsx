import { Bank } from '@blockworks-foundation/mango-v4'
import TabButtons from '@components/shared/TabButtons'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import { TokenStatsItem } from 'types'
import { formatYAxis } from 'utils/formatting'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import TokenRatesChart from './TokenRatesChart'

const ChartTabs = ({ bank }: { bank: Bank }) => {
  const { t } = useTranslation('token')
  const [activeDepositsTab, setActiveDepositsTab] = useState('token:deposits')
  const [activeBorrowsTab, setActiveBorrowsTab] = useState('token:borrows')
  const [depositDaysToShow, setDepositDaysToShow] = useState('30')
  const [borrowDaysToShow, setBorrowDaysToShow] = useState('30')
  const [depositRateDaysToShow, setDepositRateDaysToShow] = useState('30')
  const [borrowRateDaysToShow, setBorrowRateDaysToShow] = useState('30')
  const tokenStats = mangoStore((s) => s.tokenStats.data)
  const loadingTokenStats = mangoStore((s) => s.tokenStats.loading)

  const statsHistory = useMemo(() => {
    if (!tokenStats?.length) return []
    return tokenStats.reduce((a: TokenStatsItem[], c: TokenStatsItem) => {
      if (c.token_index === bank.tokenIndex) {
        const copy = { ...c }
        a.push(copy)
      }
      return a.sort(
        (a, b) =>
          new Date(a.date_hour).getTime() - new Date(b.date_hour).getTime(),
      )
    }, [])
  }, [tokenStats, bank])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      <div className="col-span-1 border-b border-th-bkg-3 md:border-b-0 md:border-r">
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
          <div className="h-[412px] border-t border-th-bkg-3 px-6 py-6 sm:h-96">
            {activeDepositsTab === 'token:deposits' ? (
              <DetailedAreaOrBarChart
                data={statsHistory}
                daysToShow={depositDaysToShow}
                setDaysToShow={setDepositDaysToShow}
                heightClass="h-64"
                loaderHeightClass="h-[334px]"
                domain={[0, 'dataMax']}
                loading={loadingTokenStats}
                small
                tickFormat={(x) => formatYAxis(x)}
                title={`${t('token:deposits')}`}
                xKey="date_hour"
                yKey={'total_deposits'}
              />
            ) : (
              <TokenRatesChart
                data={statsHistory}
                dataKey="deposit_apr"
                daysToShow={depositRateDaysToShow}
                loading={loadingTokenStats}
                setDaysToShow={setDepositRateDaysToShow}
                title={`${t('token:average-deposit-rate')} (APR)`}
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
          <div className="h-[412px] border-t border-th-bkg-3 px-6 py-6 sm:h-96">
            {activeBorrowsTab === 'token:borrows' ? (
              <DetailedAreaOrBarChart
                data={statsHistory}
                daysToShow={borrowDaysToShow}
                setDaysToShow={setBorrowDaysToShow}
                heightClass="h-64"
                loaderHeightClass="h-[334px]"
                domain={[0, 'dataMax']}
                loading={loadingTokenStats}
                small
                tickFormat={(x) => formatYAxis(x)}
                title={`${t('token:borrows')}`}
                xKey="date_hour"
                yKey={'total_borrows'}
              />
            ) : (
              <TokenRatesChart
                data={statsHistory}
                dataKey="borrow_apr"
                daysToShow={borrowRateDaysToShow}
                loading={loadingTokenStats}
                setDaysToShow={setBorrowRateDaysToShow}
                title={`${t('token:average-borrow-rate')} (APR)`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartTabs
