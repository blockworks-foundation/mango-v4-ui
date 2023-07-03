import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import { formatYAxis } from 'utils/formatting'
import { HourlyFundingChartData, PerformanceDataItem } from 'types'
import { ContentType } from 'recharts/types/component/Tooltip'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { ChartToShow } from './AccountPage'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'

const CHART_TABS: ChartToShow[] = [
  'account-value',
  'pnl',
  'cumulative-interest-value',
]

const AccountChart = ({
  chartToShow,
  setChartToShow,
  customTooltip,
  data,
  hideChart,
  loading,
  yDecimals,
  yKey,
}: {
  chartToShow: ChartToShow
  setChartToShow: (chart: ChartToShow) => void
  customTooltip?: ContentType<number, string>
  data: PerformanceDataItem[] | HourlyFundingChartData[]
  hideChart: () => void
  loading?: boolean
  yDecimals?: number
  yKey: string
}) => {
  const { t } = useTranslation('common')
  const [daysToShow, setDaysToShow] = useState<string>('1')

  const chartData = useMemo(() => {
    if (!data.length) return []
    if (chartToShow === 'cumulative-interest-value') {
      return data.map((d) => ({
        interest_value:
          d.borrow_interest_cumulative_usd * -1 +
          d.deposit_interest_cumulative_usd,
        time: d.time,
      }))
    }
    return data
  }, [data, chartToShow])

  return (
    <>
      <div className="hide-scroll mb-3 flex h-14 items-center space-x-4 overflow-x-auto border-b border-th-bkg-3">
        <button
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center border-r border-th-bkg-3 focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2"
          onClick={hideChart}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex space-x-2">
          {CHART_TABS.map((tab) => (
            <button
              className={`whitespace-nowrap rounded-md py-1.5 px-2.5 text-sm font-medium focus-visible:bg-th-bkg-3 focus-visible:text-th-fgd-1 ${
                chartToShow === tab
                  ? 'bg-th-bkg-3 text-th-active md:hover:text-th-active'
                  : 'text-th-fgd-3 md:hover:text-th-fgd-2'
              }`}
              onClick={() => setChartToShow(tab)}
              key={tab}
            >
              {t(tab)}
            </button>
          ))}
        </div>
      </div>
      <div className="px-6 pt-4">
        <DetailedAreaOrBarChart
          customTooltip={customTooltip}
          data={chartData}
          daysToShow={daysToShow}
          heightClass="h-[calc(100vh-240px)]"
          loaderHeightClass="h-[calc(100vh-116px)]"
          loading={loading}
          prefix="$"
          setDaysToShow={setDaysToShow}
          tickFormat={(x) => `$${formatYAxis(x)}`}
          xKey="time"
          yDecimals={yDecimals}
          yKey={yKey}
        />
      </div>
    </>
  )
}

export default AccountChart
