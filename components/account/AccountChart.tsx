import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useEffect, useMemo, useState } from 'react'
import mangoStore from '@store/mangoStore'
import dynamic from 'next/dynamic'
import { formatYAxis } from 'utils/formatting'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

const AccountChart = ({
  chartToShow,
  hideChart,
  mangoAccountAddress,
  yKey,
}: {
  chartToShow: string
  hideChart: () => void
  mangoAccountAddress: string
  yKey: string
}) => {
  const { t } = useTranslation('common')
  const actions = mangoStore.getState().actions
  const [daysToShow, setDaysToShow] = useState<string>('1')
  const loading = mangoStore((s) => s.mangoAccount.performance.loading)
  const performanceData = mangoStore((s) => s.mangoAccount.performance.data)

  useEffect(() => {
    if (mangoAccountAddress) {
      actions.fetchAccountPerformance(mangoAccountAddress, 1)
    }
  }, [actions, mangoAccountAddress])

  const data: any = useMemo(() => {
    if (!performanceData.length) return []
    if (chartToShow === 'cumulative-interest-value') {
      performanceData.map((d) => ({
        interest_value:
          d.borrow_interest_cumulative_usd + d.deposit_interest_cumulative_usd,
        time: d.time,
      }))
    }
    return performanceData
  }, [performanceData])

  const handleDaysToShow = async (days: string) => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (mangoAccount) {
      await actions.fetchAccountPerformance(
        mangoAccount.publicKey.toString(),
        parseInt(days)
      )
      setDaysToShow(days)
    }
  }

  const currentValue = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const group = mangoStore.getState().group
    if (group && mangoAccount && chartToShow === 'account-value') {
      const currentAccountValue = toUiDecimalsForQuote(
        mangoAccount.getEquity(group).toNumber()
      )
      const time = Date.now()
      return [{ account_equity: currentAccountValue, time: time }]
    }
    return []
  }, [chartToShow])

  return (
    <DetailedAreaChart
      data={data.concat(currentValue)}
      daysToShow={daysToShow}
      heightClass="h-[calc(100vh-200px)]"
      loaderHeightClass="h-[calc(100vh-116px)]"
      hideChart={hideChart}
      loading={loading}
      prefix="$"
      setDaysToShow={handleDaysToShow}
      tickFormat={(x) => `$${formatYAxis(x)}`}
      title={t(chartToShow)}
      xKey="time"
      yKey={yKey}
    />
  )
}

export default AccountChart
