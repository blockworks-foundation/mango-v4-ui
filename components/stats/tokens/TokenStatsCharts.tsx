import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { formatYAxis } from 'utils/formatting'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'

const TokenStatsCharts = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const mangoStats = mangoStore((s) => s.tokenStats.mangoStats)
  const loadingStats = mangoStore((s) => s.tokenStats.loading)
  const [borrowDaysToShow, setBorrowDaysToShow] = useState('30')
  const [depositDaysToShow, setDepositDaysToShow] = useState('30')
  const banks = useBanksWithBalances()

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
          0,
        ),
      ]
    }
    return [0, 0, 0]
  }, [banks])

  return (
    <>
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:border-r">
        <DetailedAreaOrBarChart
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
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:pl-6">
        <DetailedAreaOrBarChart
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
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:border-r md:pl-6">
        <DetailedAreaOrBarChart
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
