import { MangoAccount } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import mangoStore, { PerformanceDataItem } from '../../store/state'
import DetailedAreaChart from '../shared/DetailedAreaChart'

const TotalInterestValueChart = ({
  data,
  hideChart,
  mangoAccount,
}: {
  data: Array<PerformanceDataItem>
  hideChart: () => void
  mangoAccount: MangoAccount
}) => {
  const { t } = useTranslation('common')
  const actions = mangoStore((s) => s.actions)
  const [daysToShow, setDaysToShow] = useState<number>(1)
  const loading = mangoStore((s) => s.mangoAccount.stats.performance.loading)

  const handleDaysToShow = (days: number) => {
    setDaysToShow(days)
    actions.fetchAccountPerformance(mangoAccount.publicKey.toString(), days)
  }

  const chartData = useMemo(() => {
    return data
      .slice()
      .reverse()
      .map((d) => ({
        interest_value:
          d.borrow_interest_cumulative_usd + d.deposit_interest_cumulative_usd,
        time: d.time,
      }))
  }, [data])

  return (
    <DetailedAreaChart
      data={chartData}
      daysToShow={daysToShow}
      hideChange
      hideChart={hideChart}
      loading={loading}
      setDaysToShow={handleDaysToShow}
      tickFormat={(x) => `$${x.toFixed(2)}`}
      title={t('cumulative-interest-value')}
      xKey="time"
      yKey="interest_value"
    />
  )
}

export default TotalInterestValueChart
