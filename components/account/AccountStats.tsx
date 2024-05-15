import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import useAccountPerformanceData from 'hooks/useAccountPerformanceData'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatYAxis } from 'utils/formatting'
import FundingChart from './FundingChart'
import VolumeChart from './VolumeChart'
import { useQuery } from '@tanstack/react-query'
import useMangoAccount from 'hooks/useMangoAccount'
import { fetchFundingTotals, fetchVolumeTotals } from 'utils/account'
import Tooltip from '@components/shared/Tooltip'
import SheenLoader from '@components/shared/SheenLoader'
import FormatNumericValue from '@components/shared/FormatNumericValue'

const AccountStats = ({ hideView }: { hideView: () => void }) => {
  const { t } = useTranslation(['common', 'account'])
  const { mangoAccountAddress } = useMangoAccount()
  const { performanceData, loadingPerformanceData } =
    useAccountPerformanceData()
  const [pnlDaysToShow, setPnlDaysToShow] = useState('1')
  const [interestDaysToShow, setInterestDaysToShow] = useState('1')

  const { data: fundingData, isLoading: loadingFunding } = useQuery(
    ['funding', mangoAccountAddress],
    () => fetchFundingTotals(mangoAccountAddress),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccountAddress,
    },
  )

  const { data: volumeTotalData, isLoading: loadingVolumeTotalData } = useQuery(
    ['total-volume', mangoAccountAddress],
    () => fetchVolumeTotals(mangoAccountAddress),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccountAddress,
    },
  )

  const fundingTotalValue = useMemo(() => {
    if (fundingData?.length && mangoAccountAddress) {
      return fundingData.reduce(
        (a, c) => a + c.long_funding + c.short_funding,
        0,
      )
    }
    return 0.0
  }, [fundingData, mangoAccountAddress])

  const chartData = useMemo(() => {
    if (!performanceData || !performanceData.length) return []
    const chartData = []
    for (const item of performanceData) {
      const interest =
        item.borrow_interest_cumulative_usd * -1 +
        item.deposit_interest_cumulative_usd
      chartData.push({ ...item, interest_value: interest })
    }
    return chartData
  }, [performanceData])

  return (
    <>
      <div className="flex h-14 items-center space-x-4 border-b border-th-bkg-3">
        <button
          className="flex h-14 w-14 shrink-0 items-center justify-center border-r border-th-bkg-3 focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2"
          onClick={hideView}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="text-lg">{t('account:account-stats')}</h2>
      </div>
      <div className="grid grid-cols-2">
        <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 lg:py-6">
          <DetailedAreaOrBarChart
            changeAsPercent
            data={chartData}
            daysToShow={pnlDaysToShow}
            setDaysToShow={setPnlDaysToShow}
            loading={loadingPerformanceData}
            heightClass="h-64"
            loaderHeightClass="h-[350px]"
            prefix="$"
            tickFormat={(x) => `$${formatYAxis(x)}`}
            title={t('pnl')}
            xKey="time"
            yKey="pnl"
            small
            isPrivate
          />
        </div>
        <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:pl-6 lg:py-6">
          <DetailedAreaOrBarChart
            changeAsPercent
            data={chartData}
            daysToShow={interestDaysToShow}
            setDaysToShow={setInterestDaysToShow}
            loading={loadingPerformanceData}
            heightClass="h-64"
            loaderHeightClass="h-[350px]"
            prefix="$"
            tickFormat={(x) => `$${formatYAxis(x)}`}
            title={t('cumulative-interest-value')}
            xKey="time"
            yKey="interest_value"
            small
            isPrivate
          />
        </div>
        <div className="col-span-2 border-b border-th-bkg-3 md:col-span-1">
          <div className="border-b border-th-bkg-3 px-4 py-4 md:px-6 lg:py-6">
            <Tooltip
              content={t('account:tooltip-total-funding')}
              maxWidth="20rem"
              placement="top-start"
              delay={100}
            >
              <p className="tooltip-underline text-base leading-tight">
                {t('account:total-funding-earned')}
              </p>
            </Tooltip>
            {loadingFunding && mangoAccountAddress ? (
              <SheenLoader className="mt-2">
                <div className="h-[26px] w-16 bg-th-bkg-2" />
              </SheenLoader>
            ) : (
              <p className="mt-0.5 text-2xl font-bold text-th-fgd-1">
                <FormatNumericValue
                  value={fundingTotalValue}
                  decimals={2}
                  isUsd={true}
                  isPrivate
                />
              </p>
            )}
          </div>
          <div className="px-6 py-4 lg:py-6">
            <FundingChart />
          </div>
        </div>
        <div className="col-span-2 border-b border-th-bkg-3 md:col-span-1">
          <div className="border-b border-th-bkg-3 px-4 py-4 md:px-6 lg:py-6">
            <p className="tooltip-underline text-base leading-tight">
              {t('account:lifetime-volume')}
            </p>
            {loadingVolumeTotalData && mangoAccountAddress ? (
              <SheenLoader className="mt-2">
                <div className="h-[26px] w-16 bg-th-bkg-2" />
              </SheenLoader>
            ) : (
              <p className="mt-0.5 text-2xl font-bold text-th-fgd-1">
                <FormatNumericValue
                  value={volumeTotalData || 0}
                  isUsd
                  isPrivate
                />
              </p>
            )}
          </div>
          <div className="px-6 py-4 lg:py-6">
            <VolumeChart />
          </div>
        </div>
      </div>
    </>
  )
}

export default AccountStats
