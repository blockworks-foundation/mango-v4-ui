import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenStatsItem } from 'types'

interface GroupedDataItem extends TokenStatsItem {
  intervalStartMillis: number
}

const groupByHourlyInterval = (
  data: TokenStatsItem[],
  dataKey: 'borrow_apr' | 'deposit_apr',
  intervalDurationHours: number,
) => {
  const intervalMillis = intervalDurationHours * 60 * 60 * 1000
  const groupedData = []
  let currentGroup: GroupedDataItem | null = null
  let itemsInCurrentGroup = 0

  for (let i = 0; i < data.length; i++) {
    const obj = data[i]
    const date = new Date(obj.date_hour)
    const intervalStartMillis =
      Math.floor(date.getTime() / intervalMillis) * intervalMillis

    if (
      !currentGroup ||
      currentGroup.intervalStartMillis !== intervalStartMillis
    ) {
      if (currentGroup) {
        // calculate the average for the previous group
        currentGroup[dataKey] /= itemsInCurrentGroup
        groupedData.push(currentGroup)
      }

      currentGroup = {
        ...obj,
        intervalStartMillis: intervalStartMillis,
      }

      // initialize the sum for the new group
      currentGroup[dataKey] = obj[dataKey] * 100
      itemsInCurrentGroup = 1
    } else {
      // add the value to the sum for the current group
      currentGroup[dataKey] += obj[dataKey] * 100
      itemsInCurrentGroup++
    }
  }

  // calculate the average for the last group (if it exists)
  if (currentGroup) {
    currentGroup[dataKey] /= itemsInCurrentGroup
    groupedData.push(currentGroup)
  }

  return groupedData
}

const TokenRatesChart = ({
  data,
  dataKey,
  daysToShow,
  loading,
  setDaysToShow,
  title,
}: {
  data: TokenStatsItem[]
  dataKey: 'deposit_apr' | 'borrow_apr'
  daysToShow: string | undefined
  loading: boolean
  setDaysToShow: (x: string) => void
  title: string
}) => {
  const { t } = useTranslation('stats')
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
    if (!data || !data.length) return []
    const groupedData = groupByHourlyInterval(data, dataKey, interval)
    return groupedData
  }, [data, dataKey, daysToShow, interval])

  return (
    <DetailedAreaOrBarChart
      chartType="bar"
      data={chartData}
      daysToShow={daysToShow}
      setDaysToShow={setDaysToShow}
      heightClass="h-64"
      loaderHeightClass="h-[334px]"
      loading={loading}
      small
      hideChange
      suffix="%"
      tickFormat={(x) => `${x.toFixed(2)}%`}
      title={`${t(intervalString)} ${title}`}
      xKey="date_hour"
      yKey={dataKey}
    />
  )
}

export default TokenRatesChart
