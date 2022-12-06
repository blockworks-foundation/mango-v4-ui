import {
  MangoAccount,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import mangoStore from '@store/mangoStore'
import dynamic from 'next/dynamic'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

const AccountChart = ({
  chartToShow,
  data,
  hideChart,
  mangoAccount,
  yKey,
}: {
  chartToShow: string
  data: Array<any>
  hideChart: () => void
  mangoAccount: MangoAccount
  yKey: string
}) => {
  const { t } = useTranslation('common')
  const actions = mangoStore((s) => s.actions)
  const [daysToShow, setDaysToShow] = useState<string>('1')
  const loading = mangoStore((s) => s.mangoAccount.stats.performance.loading)

  const handleDaysToShow = async (days: string) => {
    await actions.fetchAccountPerformance(
      mangoAccount.publicKey.toString(),
      parseInt(days)
    )
    setDaysToShow(days)
  }

  const currentValue = useMemo(() => {
    if (chartToShow === 'account-value') {
      const group = mangoStore.getState().group
      const currentAccountValue = toUiDecimalsForQuote(
        mangoAccount.getEquity(group!)!.toNumber()
      )
      const time = Date.now()
      return [{ account_equity: currentAccountValue, time: time }]
    }
    return []
  }, [chartToShow, mangoAccount])

  return (
    <DetailedAreaChart
      data={data.concat(currentValue)}
      daysToShow={daysToShow}
      hideChart={hideChart}
      loading={loading}
      prefix="$"
      setDaysToShow={handleDaysToShow}
      tickFormat={(x) => `$${x.toFixed(2)}`}
      title={t(chartToShow)}
      xKey="time"
      yKey={yKey}
    />
  )
}

export default AccountChart
