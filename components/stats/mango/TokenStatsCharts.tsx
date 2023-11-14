import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { useEffect, useMemo, useState } from 'react'
import { formatYAxis } from 'utils/formatting'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { MangoTokenStatsItem } from 'types'
import Switch from '@components/forms/Switch'
import NetDepositsChart from './NetDepositsChart'

interface GroupedDataItem extends MangoTokenStatsItem {
  intervalStartMillis: number
}

const groupByHourlyInterval = (
  data: MangoTokenStatsItem[],
  intervalDurationHours: number,
) => {
  const intervalMillis = intervalDurationHours * 60 * 60 * 1000
  const groupedData = []
  let currentGroup: GroupedDataItem | null = null
  for (let i = 0; i < data.length; i++) {
    const obj = data[i]
    const date = new Date(obj.date)
    const intervalStartMillis =
      Math.floor(date.getTime() / intervalMillis) * intervalMillis
    if (
      !currentGroup ||
      currentGroup.intervalStartMillis !== intervalStartMillis
    ) {
      currentGroup = {
        ...obj,
        intervalStartMillis: intervalStartMillis,
      }
      groupedData.push(currentGroup)
    } else {
      currentGroup.feesCollected += obj.feesCollected
    }
  }
  return groupedData
}

const TokenStatsCharts = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const mangoStats = mangoStore((s) => s.tokenStats.mangoStats)
  const loadingStats = mangoStore((s) => s.tokenStats.loading)
  const [borrowDaysToShow, setBorrowDaysToShow] = useState('30')
  const [depositDaysToShow, setDepositDaysToShow] = useState('30')
  const [feesDaysToShow, setFeesDaysToShow] = useState('30')
  const [showCumulativeFees, setShowCumulativeFees] = useState(true)
  const tokenStatsInitialLoad = mangoStore((s) => s.tokenStats.initialLoad)

  useEffect(() => {
    if (!tokenStatsInitialLoad) {
      const actions = mangoStore.getState().actions
      actions.fetchTokenStats()
    }
  }, [tokenStatsInitialLoad])

  const tokenFeesChartData = useMemo(() => {
    if (!mangoStats.length) return []
    if (showCumulativeFees) {
      return mangoStats
    } else {
      const transformedData = []
      for (let i = 1; i < mangoStats.length; i++) {
        const currentInterval = { ...mangoStats[i] }
        const previousInterval = mangoStats[i - 1]

        // Calculate the absolute fees for the current interval
        currentInterval.feesCollected =
          currentInterval.feesCollected - previousInterval.feesCollected

        transformedData.push(currentInterval)
      }
      transformedData.unshift(mangoStats[0])

      if (feesDaysToShow === '30') {
        return groupByHourlyInterval(transformedData, 24)
      } else if (feesDaysToShow === '7') {
        return groupByHourlyInterval(transformedData, 4)
      } else return transformedData
    }
  }, [mangoStats, feesDaysToShow, showCumulativeFees])

  return (
    <>
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:border-r">
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
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:border-r md:pl-6">
        <NetDepositsChart />
      </div>
      <div className="col-span-2 flex flex-col justify-between border-b border-th-bkg-3 md:col-span-1">
        <div className="px-4 pt-4 md:px-6">
          <DetailedAreaOrBarChart
            changeAsPercent
            data={tokenFeesChartData}
            daysToShow={feesDaysToShow}
            setDaysToShow={setFeesDaysToShow}
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
        <div className="mt-2 flex justify-end border-t border-th-bkg-3 px-4 py-2 md:px-6">
          <Switch
            checked={showCumulativeFees}
            onChange={() => setShowCumulativeFees(!showCumulativeFees)}
            small
          >
            {t('stats:show-cumulative')}
          </Switch>
        </div>
      </div>
    </>
  )
}

export default TokenStatsCharts
