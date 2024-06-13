import { useTranslation } from 'next-i18next'
import { formatYAxis } from 'utils/formatting'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import NetDepositsChart from './NetDepositsChart'
import { useTokenStats } from 'hooks/useTokenStats'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { MANGO_STATS_CHART_SETTINGS_KEY } from 'utils/constants'
import { DEFAULT_CHART_SETTINGS } from './MangoStats'

const DepositsAndBorrows = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const [chartSettings, setChartSettings] = useLocalStorageState(
    MANGO_STATS_CHART_SETTINGS_KEY,
    DEFAULT_CHART_SETTINGS,
  )
  const { data: tokenStats, isLoading } = useTokenStats()

  const handleDepositDaysToShow = (days: string) => {
    setChartSettings({
      ...chartSettings,
      depositValue: { ...chartSettings.depositValue, daysToShow: days },
    })
  }

  const handleBorrowDaysToShow = (days: string) => {
    setChartSettings({
      ...chartSettings,
      borrowValue: { ...chartSettings.borrowValue, daysToShow: days },
    })
  }

  return (
    <>
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 lg:py-6 ">
        <DetailedAreaOrBarChart
          changeAsPercent
          data={tokenStats?.mangoStats}
          daysToShow={chartSettings.depositValue.daysToShow}
          setDaysToShow={handleDepositDaysToShow}
          loading={isLoading}
          heightClass="h-64"
          loaderHeightClass="h-[350px]"
          prefix="$"
          tickFormat={(x) => `$${formatYAxis(x)}`}
          title={t('total-deposit-value')}
          xKey="date"
          yKey={'depositValue'}
        />
      </div>
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:pl-6 lg:py-6">
        <DetailedAreaOrBarChart
          changeAsPercent
          data={tokenStats?.mangoStats}
          daysToShow={chartSettings.borrowValue.daysToShow}
          setDaysToShow={handleBorrowDaysToShow}
          heightClass="h-64"
          loaderHeightClass="h-[350px]"
          loading={isLoading}
          prefix="$"
          tickFormat={(x) => `$${formatYAxis(x)}`}
          title={t('total-borrow-value')}
          xKey="date"
          yKey={'borrowValue'}
        />
      </div>
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:pl-6 lg:py-6">
        <NetDepositsChart />
      </div>
    </>
  )
}

export default DepositsAndBorrows
