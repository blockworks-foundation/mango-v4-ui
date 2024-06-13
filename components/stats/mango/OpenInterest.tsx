import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import mangoStore from '@store/mangoStore'
import useLocalStorageState from 'hooks/useLocalStorageState'
import usePerpStatsChartData from 'hooks/usePerpStatsChartData'
import { useTranslation } from 'react-i18next'
import { MANGO_STATS_CHART_SETTINGS_KEY } from 'utils/constants'
import { formatYAxis } from 'utils/formatting'
import { DEFAULT_CHART_SETTINGS } from './MangoStats'

const OpenInterest = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const { openInterestValues } = usePerpStatsChartData()
  const [chartSettings, setChartSettings] = useLocalStorageState(
    MANGO_STATS_CHART_SETTINGS_KEY,
    DEFAULT_CHART_SETTINGS,
  )
  const { daysToShow } = chartSettings.openInterest

  const handleDaysToShow = (days: string) => {
    setChartSettings({
      ...chartSettings,
      openInterest: { ...chartSettings.openInterest, daysToShow: days },
    })
  }

  return (
    <>
      <div className="col-span-2 border-b border-th-bkg-3 p-4 md:col-span-1 md:px-6 lg:py-6">
        <DetailedAreaOrBarChart
          changeAsPercent
          data={openInterestValues}
          daysToShow={daysToShow}
          setDaysToShow={handleDaysToShow}
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
    </>
  )
}

export default OpenInterest
