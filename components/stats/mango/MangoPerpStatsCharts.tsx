import { useTranslation } from 'next-i18next'
import { useEffect, useMemo, useState } from 'react'
import mangoStore from '@store/mangoStore'
import { PerpStatsItem } from 'types'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { formatYAxis } from 'utils/formatting'
import Switch from '@components/forms/Switch'

interface ValueItem {
  date: string
  value: number
}

interface PerpStatsData {
  feeValues: ValueItem[]
  openInterestValues: ValueItem[]
  volumeValues: ValueItem[]
}

interface GroupedDataItem extends ValueItem {
  intervalStartMillis: number
}

const groupByHourlyInterval = (
  data: ValueItem[],
  intervalDurationHours: number,
) => {
  const intervalMillis = intervalDurationHours * 60 * 60 * 1000
  const groupedData = []
  let currentGroup: GroupedDataItem | null = null
  for (let i = 0; i < data.length; i++) {
    const obj = data[i]
    const date = new Date(obj.date)
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
      groupedData.push(currentGroup)
    } else {
      currentGroup.value += obj.value
    }
  }
  return groupedData
}

const MangoPerpStatsCharts = () => {
  const { t } = useTranslation(['common', 'stats', 'token', 'trade'])
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const perpStats = mangoStore((s) => s.perpStats.data)
  const [feesDaysToShow, setFeesDaysToShow] = useState('30')
  const [oiDaysToShow, setOiDaysToShow] = useState('30')
  const [volumeDaysToShow, setVolumeDaysToShow] = useState('30')
  const [showCumulativeFees, setShowCumulativeFees] = useState(true)
  const [showCumulativeVolume, setShowCumulativeVolume] = useState(true)

  useEffect(() => {
    if (!perpStats || !perpStats.length) {
      const actions = mangoStore.getState().actions
      actions.fetchPerpStats()
    }
  }, [perpStats])

  const [feeValues, openInterestValues, volumeValues] = useMemo(() => {
    if (!perpStats || !perpStats.length) return [[], [], []]
    const data = perpStats.reduce(
      (a: PerpStatsData, c: PerpStatsItem) => {
        const hasDateFee = a.feeValues.find(
          (d: ValueItem) => d.date === c.date_hour,
        )

        const hasDateOpenInterest = a.openInterestValues.find(
          (d: ValueItem) => d.date === c.date_hour,
        )

        const hasDateVolume = a.volumeValues.find(
          (d: ValueItem) => d.date === c.date_hour,
        )

        if (!hasDateFee) {
          a.feeValues.push({
            date: c.date_hour,
            value: c.total_fees,
          })
        } else {
          hasDateFee.value += c.total_fees
        }

        if (!hasDateOpenInterest) {
          a.openInterestValues.push({
            date: c.date_hour,
            value: Math.floor(c.open_interest * c.price),
          })
        } else {
          hasDateOpenInterest.value += Math.floor(c.open_interest * c.price)
        }

        if (!hasDateVolume) {
          a.volumeValues.push({
            date: c.date_hour,
            value: c.cumulative_quote_volume,
          })
        } else {
          hasDateVolume.value += c.cumulative_quote_volume
        }

        return a
      },
      { feeValues: [], openInterestValues: [], volumeValues: [] },
    )

    const { feeValues, openInterestValues, volumeValues } = data

    const sortedFeeValues = feeValues.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    const sortedOpenInterestValues = openInterestValues.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    const sortedVolumeValues = volumeValues.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    let feeChartData = sortedFeeValues
    if (!showCumulativeFees) {
      const transformedData = []
      for (let i = 1; i < sortedFeeValues.length; i++) {
        const currentInterval = { ...sortedFeeValues[i] }
        const previousInterval = sortedFeeValues[i - 1]

        // Calculate the absolute fees for the current interval
        currentInterval.value = currentInterval.value - previousInterval.value

        transformedData.push(currentInterval)
      }
      transformedData.unshift(sortedFeeValues[0])

      if (feesDaysToShow === '30') {
        feeChartData = groupByHourlyInterval(transformedData, 24)
      } else if (feesDaysToShow === '7') {
        feeChartData = groupByHourlyInterval(transformedData, 4)
      } else feeChartData = transformedData
    }

    let volumeChartData = sortedVolumeValues
    if (!showCumulativeVolume) {
      const transformedData = []
      for (let i = 1; i < sortedVolumeValues.length; i++) {
        const currentInterval = { ...sortedVolumeValues[i] }
        const previousInterval = sortedVolumeValues[i - 1]

        // Calculate the absolute fees for the current interval
        currentInterval.value = currentInterval.value - previousInterval.value

        transformedData.push(currentInterval)
      }
      transformedData.unshift(sortedVolumeValues[0])

      if (volumeDaysToShow === '30') {
        volumeChartData = groupByHourlyInterval(transformedData, 24)
      } else if (volumeDaysToShow === '7') {
        volumeChartData = groupByHourlyInterval(transformedData, 4)
      } else volumeChartData = transformedData
    }

    return [feeChartData, sortedOpenInterestValues, volumeChartData]
  }, [
    feesDaysToShow,
    perpStats,
    showCumulativeFees,
    showCumulativeVolume,
    volumeDaysToShow,
  ])

  return (
    <>
      {feeValues.length ? (
        <div className="col-span-2 flex flex-col justify-between border-b border-th-bkg-3 md:col-span-1 md:border-r">
          <div className="px-4 pt-4 md:px-6">
            <DetailedAreaOrBarChart
              changeAsPercent
              data={feeValues}
              daysToShow={feesDaysToShow}
              setDaysToShow={setFeesDaysToShow}
              heightClass="h-64"
              loading={loadingPerpStats}
              loaderHeightClass="h-[350px]"
              prefix="$"
              tickFormat={(x) => `$${formatYAxis(x)}`}
              title="Perp Fees"
              xKey="date"
              yKey="value"
            />
          </div>
          <div className="mt-2 flex justify-end border-t border-th-bkg-3 px-4 py-2 md:px-6">
            <Switch
              checked={showCumulativeFees}
              onChange={() => setShowCumulativeFees(!showCumulativeFees)}
              small
            >
              {t('stats:show-cumulative')}
            </Switch>
          </div>
        </div>
      ) : null}
      {openInterestValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 px-4 py-4 md:col-span-1 md:px-6">
          <DetailedAreaOrBarChart
            changeAsPercent
            data={openInterestValues}
            daysToShow={oiDaysToShow}
            setDaysToShow={setOiDaysToShow}
            heightClass="h-64"
            loading={loadingPerpStats}
            loaderHeightClass="h-[350px]"
            prefix="$"
            tickFormat={(x) => `$${formatYAxis(x)}`}
            title={t('stats:perp-open-interest')}
            xKey="date"
            yKey="value"
          />
        </div>
      ) : null}
      {volumeValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 md:col-span-1 md:border-r">
          <div className="px-4 pt-4 md:px-6">
            <DetailedAreaOrBarChart
              changeAsPercent
              data={volumeValues}
              daysToShow={volumeDaysToShow}
              setDaysToShow={setVolumeDaysToShow}
              heightClass="h-64"
              loading={loadingPerpStats}
              loaderHeightClass="h-[350px]"
              prefix="$"
              tickFormat={(x) => `$${formatYAxis(x)}`}
              title={t('stats:perp-volume')}
              xKey="date"
              yKey="value"
            />
          </div>
          <div className="mt-2 flex justify-end border-t border-th-bkg-3 px-4 py-2 md:px-6">
            <Switch
              checked={showCumulativeVolume}
              onChange={() => setShowCumulativeVolume(!showCumulativeVolume)}
              small
            >
              {t('stats:show-cumulative')}
            </Switch>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default MangoPerpStatsCharts
