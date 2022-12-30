import SheenLoader from '@components/shared/SheenLoader'
import mangoStore, { TokenStatsItem } from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import dayjs from 'dayjs'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

interface TotalValueItem {
  date: string
  borrowValue: number
  depositValue: number
}

const MangoStats = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const tokenStats = mangoStore((s) => s.tokenStats.data)
  const loadingStats = mangoStore((s) => s.tokenStats.loading)
  const perpStats = mangoStore((s) => s.perpStats.data)
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const perpMarkets = mangoStore((s) => s.perpMarkets)
  const { group } = useMangoGroup()

  const totalFeeValues = useMemo(() => {
    if (!perpStats.length) return []
    const values = perpStats.reduce((a, c) => {
      const hasDate = a.find((d: any) => d.date === c.date_hour)
      if (!hasDate) {
        a.push({
          date: c.date_hour,
          feeValue: Math.floor(c.fees_accrued),
        })
      } else {
        hasDate.feeValue = hasDate.feeValue + Math.floor(c.fees_accrued)
      }
      return a
    }, [])
    return values.reverse()
  }, [perpStats])

  const totalOpenInterestValues = useMemo(() => {
    if (!perpStats.length) return []
    const values = perpStats.reduce((a, c) => {
      const hasDate = a.find((d: any) => d.date === c.date_hour)
      if (!hasDate) {
        a.push({
          date: c.date_hour,
          openInterest: Math.floor(c.open_interest * c.price),
        })
      } else {
        hasDate.openInterest =
          hasDate.openInterest + Math.floor(c.open_interest * c.price)
      }
      return a
    }, [])
    return values.reverse()
  }, [perpStats])

  const currentTotalOpenInterestValue = useMemo(() => {
    if (!perpMarkets.length) return 0
    return perpMarkets.reduce((a: number, c: PerpMarket) => {
      const value = a + c.openInterest.toNumber() * c.uiPrice
      return value
    }, 0)
  }, [perpMarkets])

  const totalDepositBorrowValues = useMemo(() => {
    if (tokenStats && !tokenStats.length) return []
    const values: TotalValueItem[] = tokenStats!.reduce(
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

  return (
    <div className="grid grid-cols-2">
      {loadingStats ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
          <SheenLoader className="flex flex-1">
            <div className="h-96 w-full rounded-lg bg-th-bkg-2" />
          </SheenLoader>
        </div>
      ) : totalDepositBorrowValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
          <DetailedAreaChart
            data={totalDepositBorrowValues.concat([
              {
                date: dayjs().toISOString(),
                depositValue: Math.floor(currentTotalDepositValue),
                borrowValue: Math.floor(currentTotalBorrowValue),
              },
            ])}
            daysToShow={'999'}
            heightClass="h-64"
            prefix="$"
            tickFormat={(x) => `$${x.toFixed(2)}`}
            title={t('total-deposit-value')}
            xKey="date"
            yKey={'depositValue'}
          />
        </div>
      ) : null}
      {loadingStats ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
          <SheenLoader className="flex flex-1">
            <div className="h-96 w-full rounded-lg bg-th-bkg-2" />
          </SheenLoader>
        </div>
      ) : totalDepositBorrowValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
          <DetailedAreaChart
            data={totalDepositBorrowValues.concat([
              {
                date: dayjs().toISOString(),
                borrowValue: Math.floor(currentTotalBorrowValue),
                depositValue: Math.floor(currentTotalDepositValue),
              },
            ])}
            daysToShow={'999'}
            heightClass="h-64"
            prefix="$"
            tickFormat={(x) => `$${x.toFixed(2)}`}
            title={t('total-borrow-value')}
            xKey="date"
            yKey={'borrowValue'}
          />
        </div>
      ) : null}
      {loadingPerpStats ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
          <SheenLoader className="flex flex-1">
            <div className="h-96 w-full rounded-lg bg-th-bkg-2" />
          </SheenLoader>
        </div>
      ) : totalFeeValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
          <DetailedAreaChart
            data={totalOpenInterestValues.concat([
              {
                date: dayjs().toISOString(),
                openInterest: currentTotalOpenInterestValue,
              },
            ])}
            daysToShow={'999'}
            heightClass="h-64"
            prefix="$"
            tickFormat={(x) => `$${x.toFixed(2)}`}
            title={t('trade:open-interest')}
            xKey="date"
            yKey={'openInterest'}
          />
        </div>
      ) : null}
      {loadingPerpStats ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
          <SheenLoader className="flex flex-1">
            <div className="h-96 w-full rounded-lg bg-th-bkg-2" />
          </SheenLoader>
        </div>
      ) : totalOpenInterestValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
          <DetailedAreaChart
            data={totalFeeValues}
            daysToShow={'999'}
            heightClass="h-64"
            prefix="$"
            tickFormat={(x) => `$${x.toFixed(2)}`}
            title={t('perp-fees-earned')}
            xKey="date"
            yKey={'feeValue'}
          />
        </div>
      ) : null}
    </div>
  )
}

export default MangoStats
