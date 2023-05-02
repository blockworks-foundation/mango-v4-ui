import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { formatYAxis } from 'utils/formatting'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import useMangoGroup from 'hooks/useMangoGroup'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

const TokenStatsCharts = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const { group } = useMangoGroup()
  const mangoStats = mangoStore((s) => s.tokenStats.mangoStats)
  const initialStatsLoad = mangoStore((s) => s.tokenStats.initialLoad)
  const loadingStats = mangoStore((s) => s.tokenStats.loading)
  const [borrowDaysToShow, setBorrowDaysToShow] = useState('30')
  const [depositDaysToShow, setDepositDaysToShow] = useState('30')
  const banks = useBanksWithBalances()

  useEffect(() => {
    if (group && !initialStatsLoad) {
      const actions = mangoStore.getState().actions
      actions.fetchTokenStats()
    }
  }, [group, initialStatsLoad])

  const [
    currentTotalDepositValue,
    currentTotalBorrowValue,
    currentCollectedFeesValue,
  ] = useMemo(() => {
    if (banks.length) {
      return [
        banks.reduce((a, c) => a + c.bank.uiPrice * c.bank.uiDeposits(), 0),
        banks.reduce((a, c) => a + c.bank.uiPrice * c.bank.uiBorrows(), 0),
        banks.reduce(
          (a, c) =>
            a +
            c.bank.uiPrice *
              toUiDecimals(c.bank.collectedFeesNative, c.bank.mintDecimals),
          0
        ),
      ]
    }
    return [0, 0, 0]
  }, [banks])

  return (
    <>
      <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-r">
        <DetailedAreaChart
          data={mangoStats.concat([
            {
              date: dayjs().toISOString(),
              depositValue: Math.floor(currentTotalDepositValue),
              borrowValue: Math.floor(currentTotalBorrowValue),
              feesCollected: currentCollectedFeesValue,
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
      <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:pl-6">
        <DetailedAreaChart
          data={mangoStats.concat([
            {
              date: dayjs().toISOString(),
              borrowValue: Math.floor(currentTotalBorrowValue),
              depositValue: Math.floor(currentTotalDepositValue),
              feesCollected: currentCollectedFeesValue,
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
      <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-r md:pl-6">
        <DetailedAreaChart
          data={mangoStats.concat([
            {
              date: dayjs().toISOString(),
              borrowValue: Math.floor(currentTotalBorrowValue),
              depositValue: Math.floor(currentTotalDepositValue),
              feesCollected: currentCollectedFeesValue,
            },
          ])}
          daysToShow={borrowDaysToShow}
          setDaysToShow={setBorrowDaysToShow}
          heightClass="h-64"
          loaderHeightClass="h-[350px]"
          loading={loadingStats}
          prefix="$"
          tickFormat={(x) => `$${formatYAxis(x)}`}
          title={t('token:token-fees-collected')}
          tooltipContent={t('token:tooltip-token-fees-collected')}
          xKey="date"
          yKey={'feesCollected'}
        />
      </div>
    </>
  )
}

export default TokenStatsCharts
