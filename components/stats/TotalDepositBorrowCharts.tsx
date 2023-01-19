import SheenLoader from '@components/shared/SheenLoader'
import { TokenStatsItem } from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { formatYAxis } from 'utils/formatting'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

interface TotalValueItem {
  date: string
  borrowValue: number
  depositValue: number
}

const TotalDepositBorrowCharts = ({
  tokenStats,
  loadingStats,
}: {
  tokenStats: TokenStatsItem[] | null
  loadingStats: boolean
}) => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const [borrowDaysToShow, setBorrowDaysToShow] = useState('30')
  const [depositDaysToShow, setDepositDaysToShow] = useState('30')
  const { group } = useMangoGroup()

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

  const banks = useMemo(() => {
    if (group) {
      const rawBanks = Array.from(group?.banksMapByName, ([key, value]) => ({
        key,
        value,
      }))
      return rawBanks
    }
    return []
  }, [group])

  const [currentTotalDepositValue, currentTotalBorrowValue] = useMemo(() => {
    if (banks.length) {
      return [
        banks.reduce(
          (a, c) => a + c.value[0].uiPrice * c.value[0].uiDeposits(),
          0
        ),
        banks.reduce(
          (a, c) => a + c.value[0].uiPrice * c.value[0].uiBorrows(),
          0
        ),
      ]
    }
    return [0, 0]
  }, [banks])

  return loadingStats ? (
    <>
      <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
        <SheenLoader className="flex flex-1">
          <div className="h-96 w-full rounded-lg bg-th-bkg-2" />
        </SheenLoader>
      </div>
      <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
        <SheenLoader className="flex flex-1">
          <div className="h-96 w-full rounded-lg bg-th-bkg-2" />
        </SheenLoader>
      </div>
    </>
  ) : totalDepositBorrowValues.length ? (
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
          heightClass="h-64"
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
