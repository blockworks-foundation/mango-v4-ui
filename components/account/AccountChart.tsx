import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import { formatYAxis } from 'utils/formatting'
import { HourlyFundingChartData, PerformanceDataItem } from 'types'
import { ContentType } from 'recharts/types/component/Tooltip'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { ViewToShow } from './AccountPage'
import { ArrowLeftIcon, NoSymbolIcon } from '@heroicons/react/20/solid'

const CHART_TABS: ViewToShow[] = [
  'account-value',
  'pnl',
  'cumulative-interest-value',
]

const AccountChart = ({
  chartName,
  handleViewChange,
  customTooltip,
  data,
  hideChart,
  loading,
  yDecimals,
  yKey,
}: {
  chartName: ViewToShow
  handleViewChange: (view: ViewToShow) => void
  customTooltip?: ContentType<number, string>
  data: PerformanceDataItem[] | HourlyFundingChartData[] | undefined
  hideChart: () => void
  loading?: boolean
  yDecimals?: number
  yKey: string
}) => {
  const { t } = useTranslation('common')
  const [daysToShow, setDaysToShow] = useState<string>('1')

  const chartData = useMemo(() => {
    if (!data || !data.length) return []
    if (chartName === 'cumulative-interest-value') {
      return data.map((d) => ({
        interest_value:
          d.borrow_interest_cumulative_usd * -1 +
          d.deposit_interest_cumulative_usd,
        time: d.time,
      }))
    }
    return data
  }, [data, chartName])

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
              className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium focus-visible:bg-th-bkg-3 focus-visible:text-th-fgd-1 ${
                chartName === tab
                  ? 'bg-th-bkg-3 text-th-active md:hover:text-th-active'
                  : 'text-th-fgd-3 md:hover:text-th-fgd-2'
              }`}
              onClick={() => handleViewChange(tab)}
              key={tab}
            >
              {t(tab)}
            </button>
          ))}
        </div>
      </div>
      <div className="px-6 pt-4">
        {chartData.length ? (
          <DetailedAreaOrBarChart
            customTooltip={customTooltip}
            data={chartData}
            daysToShow={daysToShow}
            heightClass="h-[calc(100vh-240px)]"
            loaderHeightClass="h-[calc(100vh-166px)]"
            loading={loading}
            prefix="$"
            setDaysToShow={setDaysToShow}
            tickFormat={(x) => `$${formatYAxis(x)}`}
            xKey="time"
            yDecimals={yDecimals}
            yKey={yKey}
          />
        ) : (
          <div className="flex flex-col items-center rounded-lg border border-th-bkg-3 p-8">
            <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
            <p>{t('account:no-data')}</p>
          </div>
        )}
      </div>
    </>
  )
}

export default AccountChart
