import mangoStore from '@store/mangoStore'
import dayjs from 'dayjs'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import { formatYAxis } from 'utils/formatting'
import { PerpStatsItem } from 'types'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import AverageFundingChart from './AverageFundingChart'

const CHART_WRAPPER_CLASSES =
  'col-span-2 lg:col-span-1 border-b border-th-bkg-3 py-4 px-4 md:px-6'
import PerpMarketParams from './PerpMarketParams'
import PerpVolumeChart from './PerpVolumeChart'

const PerpMarketDetails = ({
  marketStats,
  perpMarket,
}: {
  marketStats: PerpStatsItem[]
  perpMarket: PerpMarket
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const [priceDaysToShow, setPriceDaysToShow] = useState('30')
  const [oiDaysToShow, setOiDaysToShow] = useState('30')

  const openInterestChartData = useMemo(() => {
    if (!marketStats || !marketStats.length) return []
    const data = []
    for (const stat of marketStats) {
      const openInterest = stat.open_interest * stat.price
      data.push({ date_hour: stat.date_hour, open_interest: openInterest })
    }
    return data
  }, [marketStats])

  const lastStat = useMemo(() => {
    if (!marketStats.length) return undefined
    return marketStats[marketStats.length - 1]
  }, [marketStats])

  return (
    <div className="grid grid-cols-2">
      {marketStats?.length && lastStat && perpMarket ? (
        <>
          <div className={`${CHART_WRAPPER_CLASSES} lg:border-r`}>
            <PerpVolumeChart
              loading={loadingPerpStats}
              marketStats={marketStats}
            />
          </div>
          <div className={CHART_WRAPPER_CLASSES}>
            <DetailedAreaOrBarChart
              changeAsPercent
              data={openInterestChartData.concat([
                {
                  date_hour: dayjs().toISOString(),
                  open_interest:
                    perpMarket.baseLotsToUi(perpMarket.openInterest) *
                      perpMarket.uiPrice ||
                    lastStat.open_interest * lastStat.price,
                },
              ])}
              daysToShow={oiDaysToShow}
              setDaysToShow={setOiDaysToShow}
              heightClass="h-64"
              loading={loadingPerpStats}
              loaderHeightClass="h-[350px]"
              prefix="$"
              tickFormat={(x) => formatYAxis(x)}
              title={t('trade:open-interest')}
              xKey="date_hour"
              yKey={'open_interest'}
            />
          </div>
          <div
            className={`col-span-2 border-b border-th-bkg-3 pt-4 lg:col-span-1 lg:border-r`}
          >
            <AverageFundingChart
              loading={loadingPerpStats}
              marketStats={marketStats}
            />
          </div>
          <div className={CHART_WRAPPER_CLASSES}>
            <DetailedAreaOrBarChart
              changeAsPercent
              data={marketStats.concat([
                {
                  ...lastStat,
                  date_hour: dayjs().toISOString(),
                  price: perpMarket.uiPrice || lastStat.price,
                },
              ])}
              daysToShow={priceDaysToShow}
              setDaysToShow={setPriceDaysToShow}
              heightClass="h-72"
              loading={loadingPerpStats}
              loaderHeightClass="h-[400px]"
              prefix="$"
              tickFormat={(x) => formatYAxis(x)}
              title={t('price')}
              xKey="date_hour"
              yKey={'price'}
            />
          </div>
        </>
      ) : null}
      <div className="col-span-2">
        <PerpMarketParams market={perpMarket} />
      </div>
    </div>
  )
}

export default PerpMarketDetails
