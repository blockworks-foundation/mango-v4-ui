import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import mangoStore from '@store/mangoStore'
import dynamic from 'next/dynamic'
import { numberCompacter } from 'utils/numbers'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

const AccountChart = ({
  chartToShow,
  data,
  hideChart,
  yKey,
}: {
  chartToShow: string
  data: Array<any>
  hideChart: () => void
  yKey: string
}) => {
  const { t } = useTranslation('common')
  const actions = mangoStore.getState().actions
  const [daysToShow, setDaysToShow] = useState<string>('1')
  const loading = mangoStore((s) => s.mangoAccount.stats.performance.loading)

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
      hideChart={hideChart}
      loading={loading}
      prefix="$"
      setDaysToShow={handleDaysToShow}
      tickFormat={(x) => `$${numberCompacter.format(x)}`}
      title={t(chartToShow)}
      xKey="time"
      yKey={yKey}
    />
  )
}

export default AccountChart
