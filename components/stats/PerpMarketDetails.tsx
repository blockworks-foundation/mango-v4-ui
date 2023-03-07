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
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

const PerpMarketDetails = ({
  perpMarketName,
  setShowPerpDetails,
}: {
  perpMarketName: string
  setShowPerpDetails: (x: string) => void
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const perpMarkets = mangoStore((s) => s.perpMarkets)
  const perpStats = mangoStore((s) => s.perpStats.data)
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const [priceDaysToShow, setPriceDaysToShow] = useState('30')
  const [oiDaysToShow, setOiDaysToShow] = useState('30')
  const [hourlyFundingeDaysToShow, setHourlyFundingDaysToShow] = useState('30')
  const [instantFundingDaysToShow, setInstantFundingDaysToShow] = useState('30')
  const rate = usePerpFundingRate()

  const perpMarket = useMemo(() => {
    return perpMarkets.find((m) => (m.name = perpMarketName))
  }, [perpMarkets, perpMarketName])

  const [marketStats, lastStat] = useMemo(() => {
    if (!perpStats) return [[], undefined]
    const stats = perpStats
      .filter((stat) => stat.perp_market === perpMarketName)
      .reverse()
    return [stats, stats[stats.length - 1]]
  }, [perpStats])

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

  return (
    <div className="grid grid-cols-2">
      <div className="col-span-2 flex items-center border-b border-th-bkg-3 px-6 py-3">
        <IconButton
          className="mr-4"
          onClick={() => setShowPerpDetails('')}
          size="small"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </IconButton>
        <h2 className="text-lg">{`${perpMarketName} ${t('stats')}`}</h2>
      </div>
      {marketStats.length && lastStat ? (
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
          <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
            <DetailedAreaChart
              data={marketStats}
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
          <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
            <DetailedAreaChart
              data={marketStats.concat([
                {
                  ...lastStat,
                  date_hour: dayjs().toISOString(),
                  instantaneous_funding_rate: fundingRate
                    ? fundingRate * 100
                    : 0,
                },
              ])}
              daysToShow={instantFundingDaysToShow}
              setDaysToShow={setInstantFundingDaysToShow}
              heightClass="h-64"
              loading={loadingPerpStats}
              loaderHeightClass="h-[350px]"
              suffix="%"
              tickFormat={(x) => formatNumericValue(x, 4)}
              title={t('trade:instantaneous-funding')}
              xKey="date_hour"
              yKey={'instantaneous_funding_rate'}
              yDecimals={5}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}

export default PerpMarketDetails
