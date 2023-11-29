import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import mangoStore from '@store/mangoStore'
import usePerpStatsChartData from 'hooks/usePerpStatsChartData'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatYAxis } from 'utils/formatting'

const OpenInterest = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const [oiDaysToShow, setOiDaysToShow] = useState('30')
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const { openInterestValues } = usePerpStatsChartData()

  return (
    <>
      <div className="col-span-2 border-b border-th-bkg-3 px-4 py-4 md:col-span-1 md:px-6 lg:py-6">
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
    </>
  )
}

export default OpenInterest
