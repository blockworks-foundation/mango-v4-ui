import { IconButton } from '@components/shared/Button'
import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import dayjs from 'dayjs'
import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { formatYAxis } from 'utils/formatting'
import { formatNumericValue } from 'utils/numbers'
import { usePerpFundingRate } from '@components/trade/PerpFundingRate'
import { PerpStatsItem } from 'types'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

const PerpMarketDetails = ({
  perpMarket,
  setShowPerpDetails,
}: {
  perpMarket: PerpMarket
  setShowPerpDetails: (x: PerpMarket | null) => void
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const perpStats = mangoStore((s) => s.perpStats.data)
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const [priceDaysToShow, setPriceDaysToShow] = useState('30')
  const [oiDaysToShow, setOiDaysToShow] = useState('30')
  const [hourlyFundingeDaysToShow, setHourlyFundingDaysToShow] = useState('30')
  const rate = usePerpFundingRate()

  const [marketStats, lastStat] = useMemo(() => {
    if (!perpStats) return [undefined, undefined]
    const stats = perpStats
      .filter((stat) => stat.perp_market === perpMarket.name)
      .reverse()
    return [stats, stats[stats.length - 1]]
  }, [perpStats, perpMarket])

  const fundingRate = useMemo(() => {
    if (!lastStat) return 0
    if (rate?.isSuccess) {
      const marketRate = rate?.data?.find(
        (r) => r.market_index === perpMarket?.perpMarketIndex
      )
      return marketRate?.funding_rate_hourly
    }
    return lastStat.instantaneous_funding_rate
  }, [rate, lastStat])

  const perpHourlyStats = useMemo(() => {
    const latestStat = { ...lastStat } as PerpStatsItem
    latestStat.instantaneous_funding_rate = fundingRate ? fundingRate : 0
    latestStat.date_hour = dayjs().toISOString()
    if (marketStats) {
      const perpHourly = marketStats.concat([latestStat])
      return perpHourly.map((stat) => ({
        ...stat,
        funding_rate_hourly: stat.funding_rate_hourly * 100,
      }))
    }
  }, [marketStats, fundingRate])

  return (
    <div className="grid grid-cols-2">
      <div className="col-span-2 flex items-center border-b border-th-bkg-3 px-6 py-3">
        <IconButton
          className="mr-4"
          onClick={() => setShowPerpDetails(null)}
          size="small"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </IconButton>
        <h2 className="text-lg">{`${perpMarket.name} ${t('stats')}`}</h2>
      </div>
      {marketStats?.length && lastStat ? (
        <>
          <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
            <DetailedAreaChart
              data={marketStats.concat([
                {
                  ...lastStat,
                  date_hour: dayjs().toISOString(),
                  price: perpMarket?._uiPrice || lastStat.price,
                },
              ])}
              daysToShow={priceDaysToShow}
              setDaysToShow={setPriceDaysToShow}
              heightClass="h-64"
              loading={loadingPerpStats}
              loaderHeightClass="h-[350px]"
              prefix="$"
              tickFormat={(x) => formatYAxis(x)}
              title={t('price')}
              xKey="date_hour"
              yKey={'price'}
            />
          </div>
          <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
            <DetailedAreaChart
              data={marketStats.concat([
                {
                  ...lastStat,
                  date_hour: dayjs().toISOString(),
                  open_interest:
                    perpMarket?.baseLotsToUi(perpMarket.openInterest) ||
                    lastStat.open_interest,
                },
              ])}
              daysToShow={oiDaysToShow}
              setDaysToShow={setOiDaysToShow}
              heightClass="h-64"
              loading={loadingPerpStats}
              loaderHeightClass="h-[350px]"
              tickFormat={(x) => formatYAxis(x)}
              title={t('trade:open-interest')}
              xKey="date_hour"
              yKey={'open_interest'}
            />
          </div>
          <div className="col-span-2 border-b border-r border-th-bkg-3 py-4 px-6 md:col-span-1">
            <DetailedAreaChart
              data={perpHourlyStats ? perpHourlyStats : []}
              daysToShow={hourlyFundingeDaysToShow}
              setDaysToShow={setHourlyFundingDaysToShow}
              heightClass="h-64"
              loading={loadingPerpStats}
              loaderHeightClass="h-[350px]"
              suffix="%"
              tickFormat={(x) => formatNumericValue(x, 4)}
              title={t('trade:hourly-funding')}
              xKey="date_hour"
              yKey={'funding_rate_hourly'}
              yDecimals={5}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}

export default PerpMarketDetails
