import mangoStore, { TokenStatsItem } from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { formatYAxis } from 'utils/formatting'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

interface TotalValueItem {
  date: string
  borrowValue: number
  depositValue: number
}

const TotalDepositBorrowCharts = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const tokenStats = mangoStore((s) => s.tokenStats.data)
  const loadingStats = mangoStore((s) => s.tokenStats.loading)
  const [borrowDaysToShow, setBorrowDaysToShow] = useState('30')
  const [depositDaysToShow, setDepositDaysToShow] = useState('30')
  const banks = useBanksWithBalances()

  const totalDepositBorrowValues = useMemo(() => {
    if (!tokenStats) return []
    const values: TotalValueItem[] = tokenStats.reduce(
      (a: TotalValueItem[], c: TokenStatsItem) => {
        const hasDate = a.find((d: TotalValueItem) => d.date === c.date_hour)
        if (!hasDate) {
          a.push({
            date: c.date_hour,
            depositValue: Math.floor(c.total_deposits * c.price),
            borrowValue: Math.floor(c.total_borrows * c.price),
          })
        } else {
          hasDate.depositValue =
            hasDate.depositValue + Math.floor(c.total_deposits * c.price)
          hasDate.borrowValue =
            hasDate.borrowValue + Math.floor(c.total_borrows * c.price)
        }
        return a
      },
      []
    )
    return values.reverse()
  }, [tokenStats])

  const filteredBorrowValues = useMemo(() => {
    if (!totalDepositBorrowValues) return []
    if (borrowDaysToShow !== '30') {
      const seconds = Number(borrowDaysToShow) * 86400
      const data = totalDepositBorrowValues.filter((d) => {
        const dataTime = new Date(d.date).getTime() / 1000
        const now = new Date().getTime() / 1000
        const limit = now - seconds
        return dataTime >= limit
      })
      return data
    }
    return totalDepositBorrowValues
  }, [totalDepositBorrowValues, borrowDaysToShow])

  const filteredDepositValues = useMemo(() => {
    if (!totalDepositBorrowValues) return []
    if (depositDaysToShow !== '30') {
      const seconds = Number(depositDaysToShow) * 86400
      const data = totalDepositBorrowValues.filter((d) => {
        const dataTime = new Date(d.date).getTime() / 1000
        const now = new Date().getTime() / 1000
        const limit = now - seconds
        return dataTime >= limit
      })
      return data
    }
    return totalDepositBorrowValues
  }, [totalDepositBorrowValues, depositDaysToShow])

  const [currentTotalDepositValue, currentTotalBorrowValue] = useMemo(() => {
    if (banks.length) {
      return [
        banks.reduce((a, c) => a + c.bank.uiPrice * c.bank.uiDeposits(), 0),
        banks.reduce((a, c) => a + c.bank.uiPrice * c.bank.uiBorrows(), 0),
      ]
    }
    return [0, 0]
  }, [banks])

  return totalDepositBorrowValues.length ? (
    <>
      <div className="col-span-2 h-96 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
        <DetailedAreaChart
          data={filteredDepositValues.concat([
            {
              date: dayjs().toISOString(),
              depositValue: Math.floor(currentTotalDepositValue),
              borrowValue: Math.floor(currentTotalBorrowValue),
            },
          ])}
          daysToShow={depositDaysToShow}
          setDaysToShow={setDepositDaysToShow}
          loading={loadingStats}
          heightClass="h-64"
          loaderHeightClass="h-[350px]"
          prefix="$"
          tickFormat={(x) => `$${formatYAxis(x)}`}
          title={t('total-deposit-value')}
          xKey="date"
          yKey={'depositValue'}
        />
      </div>
      <div className="col-span-2 h-96 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
        <DetailedAreaChart
          data={filteredBorrowValues.concat([
            {
              date: dayjs().toISOString(),
              borrowValue: Math.floor(currentTotalBorrowValue),
              depositValue: Math.floor(currentTotalDepositValue),
            },
          ])}
          daysToShow={borrowDaysToShow}
          setDaysToShow={setBorrowDaysToShow}
          heightClass="h-64"
          loaderHeightClass="h-[350px]"
          loading={loadingStats}
          prefix="$"
          tickFormat={(x) => `$${formatYAxis(x)}`}
          title={t('total-borrow-value')}
          xKey="date"
          yKey={'borrowValue'}
        />
      </div>
    </>
  ) : null
}

export default TotalDepositBorrowCharts
