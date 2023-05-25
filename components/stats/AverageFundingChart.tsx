import { useMemo, useState } from 'react'
import { PerpStatsItem } from 'types'
import { formatNumericValue } from 'utils/numbers'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { useTranslation } from 'next-i18next'

interface GroupedDataItem extends PerpStatsItem {
  intervalStartMillis: number
}

const AverageFundingChart = ({
  loading,
  marketStats,
}: {
  loading: boolean
  marketStats: PerpStatsItem[]
}) => {
  const { t } = useTranslation('common')
  const [daysToShow, setDaysToShow] = useState('30')

  const groupByHourlyInterval = (
    data: PerpStatsItem[],
    intervalDurationHours: number
  ) => {
    const intervalMillis = intervalDurationHours * 60 * 60 * 1000
    const groupedData = []
    let currentGroup: GroupedDataItem | null = null
    for (let i = 0; i < data.length; i++) {
      const obj = data[i]
      const date = new Date(obj.date_hour)
      const intervalStartMillis =
        Math.floor(date.getTime() / intervalMillis) * intervalMillis
      if (
        !currentGroup ||
        currentGroup.intervalStartMillis !== intervalStartMillis
      ) {
        currentGroup = {
          ...obj,
          intervalStartMillis: intervalStartMillis,
        }
        currentGroup.funding_rate_hourly = obj.funding_rate_hourly * 100
        groupedData.push(currentGroup)
      } else {
        currentGroup.funding_rate_hourly += obj.funding_rate_hourly * 100
      }
    }
    return groupedData
  }

  const chartData = useMemo(() => {
    if (!marketStats) return []
    const interval = daysToShow === '30' ? 24 : daysToShow === '7' ? 6 : 1
    const groupedData = groupByHourlyInterval(marketStats, interval)
    return groupedData
  }, [daysToShow, marketStats])

  return (
    <DetailedAreaOrBarChart
      data={chartData}
      daysToShow={daysToShow}
      setDaysToShow={setDaysToShow}
      heightClass="h-64"
      loading={loading}
      loaderHeightClass="h-[350px]"
      suffix="%"
      tickFormat={(x) => formatNumericValue(x, 4)}
      title={t('trade:average-funding')}
      xKey="date_hour"
      yKey="funding_rate_hourly"
      yDecimals={5}
      chartType="bar"
      tooltipDateFormat={daysToShow === '30' ? 'DD MMM YY' : ''}
    />
  )
}

export default AverageFundingChart
