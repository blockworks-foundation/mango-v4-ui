import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import mangoStore from '@store/mangoStore'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { formatYAxis } from 'utils/formatting'
import Switch from '@components/forms/Switch'
import usePerpStatsChartData from 'hooks/usePerpStatsChartData'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { MANGO_STATS_CHART_SETTINGS_KEY } from 'utils/constants'
import { DEFAULT_CHART_SETTINGS } from './MangoStats'

export interface PerpValueItem {
  date: string
  value: number
}

interface GroupedDataPerpItem extends PerpValueItem {
  intervalStartMillis: number
}

export const groupPerpByHourlyInterval = (
  data: PerpValueItem[],
  intervalDurationHours: number,
) => {
  const intervalMillis = intervalDurationHours * 60 * 60 * 1000
  const groupedData = []
  let currentGroup: GroupedDataPerpItem | null = null
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

const Volume = () => {
  const { t } = useTranslation(['common', 'stats', 'token', 'trade'])
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const { volumeValues: perpVolumeChartData } = usePerpStatsChartData()
  const [chartSettings, setChartSettings] = useLocalStorageState(
    MANGO_STATS_CHART_SETTINGS_KEY,
    DEFAULT_CHART_SETTINGS,
  )
  const { daysToShow, showCumulative } = chartSettings.perpVolume

  const perpVolumeValues = useMemo(() => {
    if (!perpVolumeChartData || !perpVolumeChartData.length) return []

    let volumeChartData = perpVolumeChartData
    if (!showCumulative) {
      const transformedData = []
      for (let i = 1; i < perpVolumeChartData.length; i++) {
        const currentInterval = { ...perpVolumeChartData[i] }
        const previousInterval = perpVolumeChartData[i - 1]

        // Calculate the absolute fees for the current interval
        currentInterval.value = currentInterval.value - previousInterval.value

        transformedData.push(currentInterval)
      }
      transformedData.unshift(perpVolumeChartData[0])

      if (daysToShow === '30') {
        volumeChartData = groupPerpByHourlyInterval(transformedData, 24)
      } else if (daysToShow === '7') {
        volumeChartData = groupPerpByHourlyInterval(transformedData, 4)
      } else volumeChartData = transformedData
    }

    return volumeChartData
  }, [daysToShow, perpVolumeChartData, showCumulative])

  const handleDaysToShow = (days: string) => {
    setChartSettings({
      ...chartSettings,
      perpVolume: { ...chartSettings.perpVolume, daysToShow: days },
    })
  }

  return (
    <>
      <div className="col-span-2 border-b border-th-bkg-3 md:col-span-1">
        <div className="px-4 pt-4 md:px-6 lg:pt-6">
          <DetailedAreaOrBarChart
            changeAsPercent
            data={perpVolumeValues}
            daysToShow={daysToShow}
            setDaysToShow={handleDaysToShow}
            heightClass="h-64"
            loading={loadingPerpStats}
            loaderHeightClass="h-[350px]"
            prefix="$"
            tickFormat={(x) => `$${formatYAxis(x)}`}
            title={t('stats:perp-volume')}
            xKey="date"
            yKey="value"
            chartType={showCumulative ? 'area' : 'bar'}
          />
        </div>
        <div className="flex justify-end px-4 pb-4 md:px-6">
          <Switch
            checked={showCumulative}
            onChange={() =>
              setChartSettings({
                ...chartSettings,
                perpVolume: {
                  ...chartSettings.perpVolume,
                  showCumulative: !chartSettings.perpVolume.showCumulative,
                },
              })
            }
            small
          >
            {t('stats:show-cumulative')}
          </Switch>
        </div>
      </div>
    </>
  )
}

export default Volume
