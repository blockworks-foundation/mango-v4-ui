import { useMemo, useState } from 'react'
import { PerpStatsItem } from 'types'
import { formatNumericValue } from 'utils/numbers'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { useTranslation } from 'next-i18next'
import Switch from '@components/forms/Switch'

interface GroupedDataItem extends PerpStatsItem {
  intervalStartMillis: number
}

const groupByHourlyInterval = (
  data: PerpStatsItem[],
  intervalDurationHours: number,
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

const YEARLY_HOURS = 8760

const AverageFundingChart = ({
  loading,
  marketStats,
}: {
  loading: boolean
  marketStats: PerpStatsItem[]
}) => {
  const { t } = useTranslation(['common', 'stats', 'trade'])
  const [daysToShow, setDaysToShow] = useState('30')
  const [showAsApr, setShowAsApr] = useState(false)

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
    if (showAsApr) {
      const multiplier = YEARLY_HOURS / interval
      for (const data of groupedData) {
        data.funding_rate_hourly = data.funding_rate_hourly * multiplier
      }
    }
    return groupedData
  }, [daysToShow, interval, marketStats, showAsApr])

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="px-4 md:px-6">
        <DetailedAreaOrBarChart
          data={chartData}
          daysToShow={daysToShow}
          setDaysToShow={setDaysToShow}
          heightClass="h-64"
          loading={loading}
          loaderHeightClass="h-[350px]"
          suffix="%"
          tickFormat={(x) => formatNumericValue(x, 4)}
          title={
            showAsApr
              ? `${t('trade:average-funding', { interval: '' })} APR`
              : t('trade:average-funding', { interval: t(intervalString) })
          }
          xKey="date_hour"
          yKey="funding_rate_hourly"
          yDecimals={showAsApr ? 2 : 5}
          chartType="bar"
          tooltipDateFormat={daysToShow === '30' ? 'DD MMM YY' : ''}
        />
      </div>
      <div className="mt-2 flex justify-end border-t border-th-bkg-3 px-4 py-2 md:px-6">
        <Switch
          checked={showAsApr}
          onChange={() => setShowAsApr(!showAsApr)}
          small
        >
          {t('stats:show-as-apr')}
        </Switch>
      </div>
    </div>
  )
}

export default AverageFundingChart
