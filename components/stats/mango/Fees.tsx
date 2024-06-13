import Switch from '@components/forms/Switch'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import mangoStore from '@store/mangoStore'
import usePerpStatsChartData from 'hooks/usePerpStatsChartData'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MangoTokenStatsItem } from 'types'
import { formatYAxis } from 'utils/formatting'
import { groupPerpByHourlyInterval } from './Volume'
import { useTokenStats } from 'hooks/useTokenStats'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { MANGO_STATS_CHART_SETTINGS_KEY } from 'utils/constants'
import { DEFAULT_CHART_SETTINGS } from './MangoStats'

interface GroupedTokenDataItem extends MangoTokenStatsItem {
  intervalStartMillis: number
}

const groupTokenByHourlyInterval = (
  data: MangoTokenStatsItem[],
  intervalDurationHours: number,
) => {
  const intervalMillis = intervalDurationHours * 60 * 60 * 1000
  const groupedData = []
  let currentGroup: GroupedTokenDataItem | null = null
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
      currentGroup.feesCollected += obj.feesCollected
    }
  }
  return groupedData
}

const Fees = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const { data: tokenStats, isLoading } = useTokenStats()
  const mangoStats = tokenStats?.mangoStats
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const { feeValues: perpFeeChartData } = usePerpStatsChartData()
  const [chartSettings, setChartSettings] = useLocalStorageState(
    MANGO_STATS_CHART_SETTINGS_KEY,
    DEFAULT_CHART_SETTINGS,
  )

  const tokenFeesChartData = useMemo(() => {
    if (!mangoStats?.length) return []
    const { daysToShow, showCumulative } = chartSettings.tokenFees
    if (showCumulative) {
      return mangoStats
    } else {
      const transformedData = []
      for (let i = 1; i < mangoStats.length; i++) {
        const currentInterval = { ...mangoStats[i] }
        const previousInterval = mangoStats[i - 1]

        // Calculate the absolute fees for the current interval
        currentInterval.feesCollected =
          currentInterval.feesCollected - previousInterval.feesCollected

        transformedData.push(currentInterval)
      }
      transformedData.unshift(mangoStats[0])

      if (daysToShow === '30') {
        return groupTokenByHourlyInterval(transformedData, 24)
      } else if (daysToShow === '7') {
        return groupTokenByHourlyInterval(transformedData, 4)
      } else return transformedData
    }
  }, [mangoStats, chartSettings])

  const perpFeeValues = useMemo(() => {
    if (!perpFeeChartData || !perpFeeChartData.length) return []
    const { daysToShow, showCumulative } = chartSettings.perpFees

    let feeChartData = perpFeeChartData
    if (!showCumulative) {
      const transformedData = []
      for (let i = 1; i < perpFeeChartData.length; i++) {
        const currentInterval = { ...perpFeeChartData[i] }
        const previousInterval = perpFeeChartData[i - 1]

        // Calculate the absolute fees for the current interval
        currentInterval.value = currentInterval.value - previousInterval.value

        transformedData.push(currentInterval)
      }
      transformedData.unshift(perpFeeChartData[0])

      if (daysToShow === '30') {
        feeChartData = groupPerpByHourlyInterval(transformedData, 24)
      } else if (daysToShow === '7') {
        feeChartData = groupPerpByHourlyInterval(transformedData, 4)
      } else feeChartData = transformedData
    }

    return feeChartData
  }, [chartSettings, perpFeeChartData])

  const handleTokenFeesDaysToShow = (days: string) => {
    setChartSettings({
      ...chartSettings,
      tokenFees: { ...chartSettings.tokenFees, daysToShow: days },
    })
  }

  const handlePerpFeesDaysToShow = (days: string) => {
    setChartSettings({
      ...chartSettings,
      perpFees: { ...chartSettings.perpFees, daysToShow: days },
    })
  }

  return (
    <>
      <div className="col-span-2 flex flex-col justify-between border-b border-th-bkg-3 md:col-span-1">
        <div className="px-4 pt-4 md:px-6 lg:pt-6">
          <DetailedAreaOrBarChart
            changeAsPercent
            data={tokenFeesChartData}
            daysToShow={chartSettings.tokenFees.daysToShow}
            setDaysToShow={handleTokenFeesDaysToShow}
            heightClass="h-64"
            loaderHeightClass="h-[350px]"
            loading={isLoading}
            prefix="$"
            tickFormat={(x) => `$${formatYAxis(x)}`}
            title={t('token:token-fees-collected')}
            tooltipContent={t('token:tooltip-token-fees-collected')}
            xKey="date"
            yKey={'feesCollected'}
            chartType={chartSettings.tokenFees.showCumulative ? 'area' : 'bar'}
          />
        </div>
        <div className="flex justify-end px-4 pb-4 md:px-6">
          <Switch
            checked={chartSettings.tokenFees.showCumulative}
            onChange={() =>
              setChartSettings({
                ...chartSettings,
                tokenFees: {
                  ...chartSettings.tokenFees,
                  showCumulative: !chartSettings.tokenFees.showCumulative,
                },
              })
            }
            small
          >
            {t('stats:show-cumulative')}
          </Switch>
        </div>
      </div>
      <div className="col-span-2 flex flex-col justify-between border-b border-th-bkg-3 md:col-span-1">
        <div className="px-4 pt-4 md:px-6 lg:pt-6">
          <DetailedAreaOrBarChart
            changeAsPercent
            data={perpFeeValues}
            daysToShow={chartSettings.perpFees.daysToShow}
            setDaysToShow={handlePerpFeesDaysToShow}
            heightClass="h-64"
            loading={loadingPerpStats}
            loaderHeightClass="h-[350px]"
            prefix="$"
            tickFormat={(x) => `$${formatYAxis(x)}`}
            title="Perp Fees"
            xKey="date"
            yKey="value"
            chartType={chartSettings.perpFees.showCumulative ? 'area' : 'bar'}
          />
        </div>
        <div className="flex justify-end px-4 pb-4 md:px-6">
          <Switch
            checked={chartSettings.perpFees.showCumulative}
            onChange={() =>
              setChartSettings({
                ...chartSettings,
                perpFees: {
                  ...chartSettings.perpFees,
                  showCumulative: !chartSettings.perpFees.showCumulative,
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

export default Fees
