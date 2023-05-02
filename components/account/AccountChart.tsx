import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import { formatYAxis } from 'utils/formatting'
import { HourlyFundingChartData, PerformanceDataItem } from 'types'
import { ContentType } from 'recharts/types/component/Tooltip'
import DetailedAreaChart from '@components/shared/DetailedAreaChart'

const AccountChart = ({
  chartToShow,
  customTooltip,
  data,
  hideChart,
  loading,
  yDecimals,
  yKey,
}: {
  chartToShow: string
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
      data.map((d) => ({
        interest_value:
          d.borrow_interest_cumulative_usd + d.deposit_interest_cumulative_usd,
        time: d.time,
      }))
    }
    return data
  }, [data, chartToShow])

  return (
    <DetailedAreaChart
      customTooltip={customTooltip}
      data={chartData}
      daysToShow={daysToShow}
      heightClass="h-[calc(100vh-200px)]"
      loaderHeightClass="h-[calc(100vh-116px)]"
      hideChart={hideChart}
      loading={loading}
      prefix="$"
      setDaysToShow={setDaysToShow}
      tickFormat={(x) => `$${formatYAxis(x)}`}
      title={t(chartToShow)}
      xKey="time"
      yDecimals={yDecimals}
      yKey={yKey}
    />
  )
}

export default AccountChart
