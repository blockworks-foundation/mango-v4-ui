import { useMemo, useState } from 'react'
import { GroupedDataItem, PerpStatsItem } from 'types'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { useTranslation } from 'next-i18next'
import { formatYAxis } from 'utils/formatting'

const PerpVolumeChart = ({
  loading,
  marketStats,
}: {
  loading: boolean
  marketStats: PerpStatsItem[]
}) => {
  const { t } = useTranslation(['common', 'stats', 'trade'])
  const [daysToShow, setDaysToShow] = useState('30')

  const groupArrayByHours = (data: PerpStatsItem[], hours: number) => {
    const groupedData = []
    let currentGroup: GroupedDataItem[] = []

    for (let i = 0; i < data.length; i++) {
      const obj = data[i]
      const date = new Date(obj.date_hour)

      if (hours === 24) {
        const day = date.getDate()
        const month = date.getMonth()
        if (
          currentGroup.length === 0 ||
          (currentGroup[0].day === day && currentGroup[0].month === month)
        ) {
          currentGroup.push({ ...obj, day: day, month: month })
        } else {
          groupedData.push(currentGroup)
          currentGroup = [{ ...obj, day: day, month: month }]
        }
      } else {
        const intervalMillis = hours * 60 * 60 * 1000
        const timestamp = date.getTime()
        if (
          currentGroup.length === 0 ||
          timestamp - currentGroup[0].timestamp <= intervalMillis
        ) {
          currentGroup.push({ ...obj, timestamp: timestamp })
        } else {
          groupedData.push(currentGroup)
          currentGroup = [{ ...obj, timestamp: timestamp }]
        }
      }
    }

    if (currentGroup.length > 0) {
      groupedData.push(currentGroup)
    }
    return groupedData
  }

  const interval = useMemo(() => {
    if (daysToShow === '30') {
      return 24
    } else if (daysToShow === '7') {
      return 6
    } else {
      return 1
    }
  }, [daysToShow])

  const chartData = useMemo(() => {
    if (!marketStats) return []
    const chartData = []
    if (interval !== 1) {
      const groupedData = groupArrayByHours(marketStats, interval)
      for (let i = 0; i < groupedData.length; i++) {
        const volume =
          groupedData[i][groupedData[i].length - 1].cumulative_quote_volume -
          groupedData[i][0].cumulative_quote_volume
        chartData.push({
          date_hour: groupedData[i][groupedData[i].length - 1].date_hour,
          volume: volume,
        })
      }
    } else {
      for (let i = 0; i < marketStats.length; i++) {
        const volume =
          marketStats[i].cumulative_quote_volume -
          (marketStats[i - 1] ? marketStats[i - 1].cumulative_quote_volume : 0)
        chartData.push({
          date_hour: marketStats[i].date_hour,
          volume: volume,
        })
      }
    }

    return chartData
  }, [daysToShow, interval, marketStats])

  return (
    <DetailedAreaOrBarChart
      changeAsPercent
      data={chartData}
      daysToShow={daysToShow}
      setDaysToShow={setDaysToShow}
      heightClass="h-64"
      loading={loading}
      loaderHeightClass="h-[350px]"
      prefix="$"
      tickFormat={(x) => formatYAxis(x)}
      title={t('stats:volume')}
      xKey="date_hour"
      yKey="volume"
      chartType="bar"
      tooltipDateFormat={daysToShow === '30' ? 'DD MMM YY' : ''}
    />
  )
}

export default PerpVolumeChart
