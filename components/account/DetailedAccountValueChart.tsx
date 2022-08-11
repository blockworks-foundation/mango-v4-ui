import { MangoAccount } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useEffect, useState } from 'react'
import { fetchHourlyPerformanceStats, PerformanceDataItem } from '../../pages'
import { notify } from '../../utils/notifications'
import DetailedAreaChart from '../shared/DetailedAreaChart'

const DetailedAccountValueChart = ({
  data,
  hideChart,
  mangoAccount,
}: {
  data: Array<PerformanceDataItem>
  hideChart: () => void
  mangoAccount: MangoAccount
}) => {
  const { t } = useTranslation('common')
  const [chartData, setChartData] = useState<Array<PerformanceDataItem>>([])
  const [daysToShow, setDaysToShow] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (daysToShow === 1) {
      setChartData(data)
    } else {
      const fetchChartData = async () => {
        setLoading(true)
        try {
          const data = await fetchHourlyPerformanceStats(
            mangoAccount.publicKey.toString(),
            daysToShow
          )
          setChartData(data)
          setLoading(false)
        } catch {
          notify({
            title: 'Failed to load chart data',
            type: 'error',
          })
          setLoading(false)
        }
      }
      fetchChartData()
    }
  }, [daysToShow])

  return (
    <DetailedAreaChart
      data={chartData}
      daysToShow={daysToShow}
      hideChart={hideChart}
      loading={loading}
      setDaysToShow={setDaysToShow}
      tickFormat={(x) => `$${x.toFixed(2)}`}
      title={t('account-value')}
      xKey="time"
      yKey="account_equity"
    />
  )
}

export default DetailedAccountValueChart
