import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { useEffect, useState } from 'react'
import { formatYAxis } from 'utils/formatting'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import NetDepositsChart from './NetDepositsChart'

const DepositsAndBorrows = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const mangoStats = mangoStore((s) => s.tokenStats.mangoStats)
  const loadingStats = mangoStore((s) => s.tokenStats.loading)
  const [borrowDaysToShow, setBorrowDaysToShow] = useState('30')
  const [depositDaysToShow, setDepositDaysToShow] = useState('30')
  const tokenStatsInitialLoad = mangoStore((s) => s.tokenStats.initialLoad)

  useEffect(() => {
    if (!tokenStatsInitialLoad) {
      const actions = mangoStore.getState().actions
      actions.fetchTokenStats()
    }
  }, [tokenStatsInitialLoad])

  return (
    <>
      <h2 className="my-4 px-6 text-lg">Deposits and Borrows</h2>
      <div className="grid grid-cols-2 border-t border-th-bkg-3">
        <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 ">
          <DetailedAreaOrBarChart
            changeAsPercent
            data={mangoStats}
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
            changeAsPercent
            data={mangoStats}
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
      </div>
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:pl-6">
        <NetDepositsChart />
      </div>
    </>
  )
}

export default DepositsAndBorrows
