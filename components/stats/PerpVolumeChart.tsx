import { useMemo, useState } from 'react'
import { PerpStatsItem } from 'types'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { useTranslation } from 'next-i18next'
import { formatYAxis } from 'utils/formatting'

interface GroupedDataItem extends PerpStatsItem {
  intervalStartMillis: number
}

const PerpVolumeChart = ({
  loading,
  marketStats,
}: {
  loading: boolean
  marketStats: PerpStatsItem[]
}) => {
  const { t } = useTranslation(['common', 'stats', 'trade'])
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
        currentGroup.quote_volume = obj.quote_volume
        groupedData.push(currentGroup)
      } else {
        currentGroup.quote_volume += obj.quote_volume
      }
    }
    return groupedData
  }

  const [interval, intervalString] = useMemo(() => {
    if (daysToShow === '30') {
      return [24, 'stats:daily']
    } else if (daysToShow === '7') {
      return [6, 'stats:six-hourly']
    } else {
      return [1, 'stats:hourly']
    }
  }, [daysToShow])

  const chartData = useMemo(() => {
    if (!marketStats) return []
    const groupedData = groupByHourlyInterval(marketStats, interval)
    return groupedData
  }, [daysToShow, interval, marketStats])

  return (
    <DetailedAreaOrBarChart
      data={chartData}
      daysToShow={daysToShow}
      setDaysToShow={setDaysToShow}
      heightClass="h-64"
      loading={loading}
      loaderHeightClass="h-[350px]"
      prefix="$"
      tickFormat={(x) => formatYAxis(x)}
      title={t('trade:volume', { interval: t(intervalString) })}
      xKey="date_hour"
      yKey="quote_volume"
      // yDecimals={5}
      chartType="bar"
      tooltipDateFormat={daysToShow === '30' ? 'DD MMM YY' : ''}
    />
  )
}

export default PerpVolumeChart
