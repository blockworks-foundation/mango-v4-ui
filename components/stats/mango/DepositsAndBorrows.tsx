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
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 lg:py-6 ">
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
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:pl-6 lg:py-6">
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
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:pl-6 lg:py-6">
        <NetDepositsChart />
      </div>
    </>
  )
}

export default DepositsAndBorrows
