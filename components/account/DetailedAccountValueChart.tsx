import { MangoAccount } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useEffect, useState } from 'react'
import {
  AccountPerformanceData,
  fetchHourlyPerformanceStats,
} from '../../pages'
import DetailedAreaChart from '../shared/DetailedAreaChart'

const DetailedAccountValueChart = ({
  data,
  hideChart,
  mangoAccount,
}: {
  data: Array<AccountPerformanceData>
  hideChart: () => void
  mangoAccount: MangoAccount
}) => {
  const { t } = useTranslation('common')
  const [chartData, setChartData] = useState<Array<AccountPerformanceData>>([])
  const [daysToShow, setDaysToShow] = useState(1)

  useEffect(() => {
    if (daysToShow === 1) {
      setChartData(data)
    } else {
      const fetchChartData = async () => {
        const data = await fetchHourlyPerformanceStats(
          mangoAccount.publicKey.toString(),
          daysToShow
        )
        setChartData(data)
      }
      fetchChartData()
    }
  }, [daysToShow])

  return (
    <DetailedAreaChart
      data={chartData}
      daysToShow={daysToShow}
      hideChart={hideChart}
      setDaysToShow={setDaysToShow}
      tickFormat={(x) => `$${x.toFixed(2)}`}
      title={t('account-value')}
      xKey="time"
      yKey="account_equity"
    />
  )
}

export default DetailedAccountValueChart
