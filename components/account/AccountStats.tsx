import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import useAccountPerformanceData from 'hooks/useAccountPerformanceData'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatYAxis } from 'utils/formatting'
import FundingChart from './FundingChart'
import VolumeChart from './VolumeChart'

const AccountStats = ({ hideView }: { hideView: () => void }) => {
  const { t } = useTranslation(['common', 'account'])
  const { performanceData, loadingPerformanceData } =
    useAccountPerformanceData()
  const [pnlDaysToShow, setPnlDaysToShow] = useState('1')
  const [interestDaysToShow, setInterestDaysToShow] = useState('1')

  const chartData = useMemo(() => {
    if (!performanceData || !performanceData.length) return []
    const chartData = []
    for (const item of performanceData) {
      const interest =
        item.borrow_interest_cumulative_usd * -1 +
        item.deposit_interest_cumulative_usd
      chartData.push({ ...item, interest_value: interest })
    }
    return chartData
  }, [performanceData])

  return (
    <>
      <div className="flex h-14 items-center space-x-4 border-b border-th-bkg-3">
        <button
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center border-r border-th-bkg-3 focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2"
          onClick={hideView}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="text-lg">{t('account:account-stats')}</h2>
      </div>
      <div className="grid grid-cols-2">
        <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:border-r">
          <DetailedAreaOrBarChart
            data={chartData}
            daysToShow={pnlDaysToShow}
            setDaysToShow={setPnlDaysToShow}
            loading={loadingPerformanceData}
            heightClass="h-64"
            loaderHeightClass="h-[350px]"
            prefix="$"
            tickFormat={(x) => `$${formatYAxis(x)}`}
            title={t('pnl')}
            xKey="time"
            yKey="pnl"
          />
        </div>
        <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:pl-6">
          <DetailedAreaOrBarChart
            data={chartData}
            daysToShow={interestDaysToShow}
            setDaysToShow={setInterestDaysToShow}
            loading={loadingPerformanceData}
            heightClass="h-64"
            loaderHeightClass="h-[350px]"
            prefix="$"
            tickFormat={(x) => `$${formatYAxis(x)}`}
            title={t('cumulative-interest-value')}
            xKey="time"
            yKey="interest_value"
          />
        </div>
        <div className="col-span-2 h-[400px] border-b border-th-bkg-3 md:col-span-1 md:border-r">
          <FundingChart />
        </div>
        <div className="col-span-2 h-[400px] border-b border-th-bkg-3 md:col-span-1">
          <VolumeChart />
        </div>
      </div>
    </>
  )
}

export default AccountStats
