import { IconButton } from '@components/shared/Button'
import SheenLoader from '@components/shared/SheenLoader'
import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { formatYAxis } from 'utils/formatting'
import { formatNumericValue } from 'utils/numbers'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

const PerpMarketDetails = ({
  perpMarket,
  setShowPerpDetails,
}: {
  perpMarket: string
  setShowPerpDetails: (x: string) => void
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const perpStats = mangoStore((s) => s.perpStats.data)
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)

  const marketStats = useMemo(() => {
    if (!perpStats) return []
    return perpStats.filter((stat) => stat.perp_market === perpMarket).reverse()
  }, [perpStats])

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
        <h2 className="text-lg">{`${perpMarket} ${t('stats')}`}</h2>
      </div>
      {loadingPerpStats ? (
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
      ) : marketStats.length ? (
        <>
          <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
            <DetailedAreaChart
              data={marketStats}
              daysToShow={'999'}
              heightClass="h-64"
              prefix="$"
              tickFormat={(x) => formatYAxis(x)}
              title={t('price')}
              xKey="date_hour"
              yKey={'price'}
            />
          </div>
          <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
            <DetailedAreaChart
              data={marketStats}
              daysToShow={'999'}
              heightClass="h-64"
              tickFormat={(x) => Math.floor(x).toString()}
              title={t('trade:open-interest')}
              xKey="date_hour"
              yKey={'open_interest'}
            />
          </div>
          <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
            <DetailedAreaChart
              data={marketStats}
              daysToShow={'999'}
              heightClass="h-64"
              suffix="%"
              tickFormat={(x) => formatNumericValue(x, 4)}
              title={t('trade:hourly-funding')}
              xKey="date_hour"
              yKey={'funding_rate_hourly'}
            />
          </div>
          <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
            <DetailedAreaChart
              data={marketStats}
              daysToShow={'999'}
              heightClass="h-64"
              suffix="%"
              tickFormat={(x) => formatNumericValue(x, 4)}
              title={t('trade:instantaneous-funding')}
              xKey="date_hour"
              yKey={'instantaneous_funding_rate'}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}

export default PerpMarketDetails
