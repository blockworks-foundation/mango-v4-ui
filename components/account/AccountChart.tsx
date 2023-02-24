import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { formatYAxis } from 'utils/formatting'
import { PerformanceDataItem } from 'types'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

const AccountChart = ({
  chartToShow,
  data,
  hideChart,
  yKey,
}: {
  chartToShow: string
  data: PerformanceDataItem[]
  hideChart: () => void
  yKey: string
}) => {
  const { t } = useTranslation('common')
  const [daysToShow, setDaysToShow] = useState<string>('1')

  const chartData: any = useMemo(() => {
    if (!data.length) return []
    if (chartToShow === 'cumulative-interest-value') {
      data.map((d) => ({
        interest_value:
          d.borrow_interest_cumulative_usd + d.deposit_interest_cumulative_usd,
        time: d.time,
      }))
    }
    return data
  }, [data])

  return (
    <DetailedAreaChart
      data={chartData}
      daysToShow={daysToShow}
      heightClass="h-[calc(100vh-200px)]"
      loaderHeightClass="h-[calc(100vh-116px)]"
      hideChart={hideChart}
      prefix="$"
      setDaysToShow={setDaysToShow}
      tickFormat={(x) => `$${formatYAxis(x)}`}
      title={t(chartToShow)}
      xKey="time"
      yKey={yKey}
    />
  )
}

export default AccountChart
