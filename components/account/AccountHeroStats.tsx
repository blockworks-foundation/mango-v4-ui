import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { useEffect, useMemo } from 'react'
import { ViewToShow } from './AccountPage'
import { useQuery } from '@tanstack/react-query'
import { fetchFundingTotals, fetchVolumeTotals } from 'utils/account'
import Tooltip from '@components/shared/Tooltip'
import {
  HealthType,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import HealthBar from './HealthBar'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { IconButton } from '@components/shared/Button'
import { CalendarIcon, ChartBarIcon } from '@heroicons/react/20/solid'
import Change from '@components/shared/Change'
import SheenLoader from '@components/shared/SheenLoader'
import { PerformanceDataItem } from 'types'
import useAccountHourlyVolumeStats from 'hooks/useAccountHourlyVolumeStats'

const AccountHeroStats = ({
  accountPnl,
  accountValue,
  rollingDailyData,
  setShowPnlHistory,
  handleViewChange,
}: {
  accountPnl: number
  accountValue: number
  rollingDailyData: PerformanceDataItem[]
  setShowPnlHistory: (show: boolean) => void
  handleViewChange: (view: ViewToShow) => void
}) => {
  const { t } = useTranslation(['common', 'account'])
  const { group } = useMangoGroup()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const { hourlyVolumeData, loadingHourlyVolume } =
    useAccountHourlyVolumeStats()

  const totalInterestData = mangoStore(
    (s) => s.mangoAccount.interestTotals.data,
  )

  useEffect(() => {
    if (mangoAccountAddress) {
      const actions = mangoStore.getState().actions
      actions.fetchAccountInterestTotals(mangoAccountAddress)
    }
  }, [mangoAccountAddress])

  const {
    data: fundingData,
    isLoading: loadingFunding,
    isFetching: fetchingFunding,
  } = useQuery(
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

  const {
    data: volumeTotalData,
    isLoading: loadingVolumeTotalData,
    isFetching: fetchingVolumeTotalData,
  } = useQuery(
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

  const maintHealth = useMemo(() => {
    return group && mangoAccount
      ? mangoAccount.getHealthRatioUi(group, HealthType.maint)
      : 0
  }, [mangoAccount, group])

  const leverage = useMemo(() => {
    if (!group || !mangoAccount) return 0
    const assetsValue = toUiDecimalsForQuote(
      mangoAccount.getAssetsValue(group).toNumber(),
    )

    if (isNaN(assetsValue / accountValue)) {
      return 0
    } else {
      return Math.abs(1 - assetsValue / accountValue)
    }
  }, [mangoAccount, group, accountValue])

  const rollingDailyPnlChange = useMemo(() => {
    if (!accountPnl || !rollingDailyData.length) return 0
    return accountPnl - rollingDailyData[0].pnl
  }, [accountPnl, rollingDailyData])

  const interestTotalValue = useMemo(() => {
    if (totalInterestData.length) {
      return totalInterestData.reduce(
        (a, c) => a + (c.borrow_interest_usd * -1 + c.deposit_interest_usd),
        0,
      )
    }
    return 0.0
  }, [totalInterestData])

  const fundingTotalValue = useMemo(() => {
    if (fundingData?.length && mangoAccountAddress) {
      return fundingData.reduce(
        (a, c) => a + c.long_funding + c.short_funding,
        0,
      )
    }
    return 0.0
  }, [fundingData, mangoAccountAddress])

  const oneDayInterestChange = useMemo(() => {
    if (rollingDailyData.length) {
      const first = rollingDailyData[0]
      const latest = rollingDailyData[rollingDailyData.length - 1]

      const startDayInterest =
        first.borrow_interest_cumulative_usd +
        first.deposit_interest_cumulative_usd

      const endDayInterest =
        latest.borrow_interest_cumulative_usd +
        latest.deposit_interest_cumulative_usd

      return endDayInterest - startDayInterest
    }
    return 0.0
  }, [rollingDailyData])

  const dailyVolume = useMemo(() => {
    if (!hourlyVolumeData || !hourlyVolumeData.length) return 0
    // Calculate the current time in milliseconds
    const currentTime = new Date().getTime()

    // Calculate the start time for the last 24 hours in milliseconds
    const last24HoursStartTime = currentTime - 24 * 60 * 60 * 1000

    // Filter the formatted data based on the timestamp
    const last24HoursData = hourlyVolumeData.filter((entry) => {
      const timestampMs = new Date(entry.time).getTime()
      return timestampMs >= last24HoursStartTime && timestampMs <= currentTime
    })

    const volume = last24HoursData.reduce((a, c) => a + c.total_volume_usd, 0)
    return volume
  }, [hourlyVolumeData])

  const loadingTotalVolume = fetchingVolumeTotalData || loadingVolumeTotalData

  return (
    <>
      <div className="grid grid-cols-6 border-b border-th-bkg-3">
        <div className="col-span-6 border-t border-th-bkg-3 py-3 pl-6 pr-4 md:col-span-3 lg:col-span-2 lg:border-t-0 2xl:col-span-1">
          <div id="account-step-four">
            <div className="flex justify-between">
              <Tooltip
                maxWidth="20rem"
                placement="top-start"
                delay={100}
                content={
                  <div className="flex-col space-y-2 text-sm">
                    <p className="text-xs">
                      Health describes how close your account is to liquidation.
                      The lower your account health is the more likely you are
                      to get liquidated when prices fluctuate.
                    </p>
                    {maintHealth < 100 && mangoAccountAddress ? (
                      <>
                        <p className="text-xs font-bold text-th-fgd-1">
                          Your account health is {maintHealth}%
                        </p>
                        <p className="text-xs">
                          <span className="font-bold text-th-fgd-1">
                            Scenario:
                          </span>{' '}
                          If the prices of all your liabilities increase by{' '}
                          {maintHealth}%, even for just a moment, some of your
                          liabilities will be liquidated.
                        </p>
                        <p className="text-xs">
                          <span className="font-bold text-th-fgd-1">
                            Scenario:
                          </span>{' '}
                          If the value of your total collateral decreases by{' '}
                          {(
                            (1 - 1 / ((maintHealth || 0) / 100 + 1)) *
                            100
                          ).toFixed(2)}
                          % , some of your liabilities will be liquidated.
                        </p>
                        <p className="text-xs">
                          These are examples. A combination of events can also
                          lead to liquidation.
                        </p>
                      </>
                    ) : null}
                  </div>
                }
              >
                <p className="tooltip-underline">{t('health')}</p>
              </Tooltip>
              {mangoAccountAddress ? (
                <Tooltip
                  className="hidden md:block"
                  content={t('account:health-contributions')}
                  delay={100}
                >
                  <IconButton
                    className="text-th-fgd-3"
                    hideBg
                    onClick={() => handleViewChange('health-contributions')}
                  >
                    <ChartBarIcon className="h-5 w-5" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </div>
            <div className="mb-0.5 mt-1 flex items-center space-x-3">
              <p className="text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
                {maintHealth}%
              </p>
              <HealthBar health={maintHealth} />
            </div>
            <span className="flex text-xs font-normal text-th-fgd-4">
              <Tooltip
                content={t('account:tooltip-leverage')}
                maxWidth="20rem"
                placement="top-start"
                delay={100}
              >
                <span className="tooltip-underline">{t('leverage')}</span>:
              </Tooltip>
              <span className="ml-1 font-mono text-th-fgd-2">
                <FormatNumericValue value={leverage} decimals={2} roundUp />x
              </span>
            </span>
          </div>
        </div>
        <div className="col-span-6 flex border-t border-th-bkg-3 py-3 pl-6 md:col-span-3 md:border-l lg:col-span-2 lg:border-t-0 2xl:col-span-1">
          <div id="account-step-five">
            <Tooltip
              content={t('account:tooltip-free-collateral')}
              maxWidth="20rem"
              placement="top-start"
              delay={100}
            >
              <p className="tooltip-underline">{t('free-collateral')}</p>
            </Tooltip>
            <p className="mb-0.5 mt-1 text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              <FormatNumericValue
                value={
                  group && mangoAccount
                    ? toUiDecimalsForQuote(
                        mangoAccount.getCollateralValue(group),
                      )
                    : 0
                }
                decimals={2}
                isUsd={true}
              />
            </p>
            <span className="text-xs font-normal text-th-fgd-4">
              <Tooltip
                content={t('account:tooltip-total-collateral')}
                maxWidth="20rem"
                placement="top-start"
                delay={100}
              >
                <span className="tooltip-underline">{t('total')}</span>:
                <span className="ml-1 font-mono text-th-fgd-2">
                  <FormatNumericValue
                    value={
                      group && mangoAccount
                        ? toUiDecimalsForQuote(
                            mangoAccount.getAssetsValue(group, HealthType.init),
                          )
                        : 0
                    }
                    decimals={2}
                    isUsd={true}
                  />
                </span>
              </Tooltip>
            </span>
          </div>
        </div>
        <div className="col-span-6 flex border-t border-th-bkg-3 py-3 pl-6 pr-4 md:col-span-3 lg:col-span-2 lg:border-l lg:border-t-0 2xl:col-span-1">
          <div
            id="account-step-seven"
            className="flex w-full flex-col items-start"
          >
            <div className="flex w-full items-center justify-between">
              <Tooltip
                content={t('account:tooltip-pnl')}
                placement="top-start"
                delay={100}
              >
                <p className="tooltip-underline">{t('pnl')}</p>
              </Tooltip>
              {mangoAccountAddress ? (
                <div className="flex items-center space-x-3">
                  <Tooltip
                    className="hidden md:block"
                    content={t('account:pnl-chart')}
                    delay={100}
                  >
                    <IconButton
                      className="text-th-fgd-3"
                      hideBg
                      onClick={() => handleViewChange('pnl')}
                    >
                      <ChartBarIcon className="h-5 w-5" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip
                    className="hidden md:block"
                    content={t('account:pnl-history')}
                    delay={100}
                  >
                    <IconButton
                      className="text-th-fgd-3"
                      hideBg
                      onClick={() => setShowPnlHistory(true)}
                    >
                      <CalendarIcon className="h-5 w-5" />
                    </IconButton>
                  </Tooltip>
                </div>
              ) : null}
            </div>
            <p className="mb-0.5 mt-1 text-left text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              <FormatNumericValue
                value={accountPnl}
                decimals={2}
                isUsd={true}
              />
            </p>
            <div className="flex space-x-1.5">
              <Change change={rollingDailyPnlChange} prefix="$" size="small" />
              <p className="text-xs text-th-fgd-4">{t('rolling-change')}</p>
            </div>
          </div>
        </div>
        <div className="col-span-6 border-t border-th-bkg-3 py-3 pl-6 pr-4 md:col-span-3 md:border-l lg:col-span-2 lg:border-l-0 2xl:col-span-1 2xl:border-l 2xl:border-t-0">
          <div id="account-step-six">
            <div className="flex w-full items-center justify-between">
              <p>{t('account:lifetime-volume')}</p>
              {mangoAccountAddress ? (
                <Tooltip
                  className="hidden md:block"
                  content={t('account:volume-chart')}
                  delay={100}
                >
                  <IconButton
                    className="text-th-fgd-3"
                    hideBg
                    onClick={() => handleViewChange('hourly-volume')}
                  >
                    <ChartBarIcon className="h-5 w-5" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </div>
            {loadingTotalVolume && mangoAccountAddress ? (
              <SheenLoader className="mt-1">
                <div className="h-7 w-16 bg-th-bkg-2" />
              </SheenLoader>
            ) : (
              <p className="mt-1 text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
                <FormatNumericValue value={volumeTotalData || 0} isUsd />
              </p>
            )}
            <span className="flex items-center text-xs font-normal text-th-fgd-4">
              <span>{t('account:daily-volume')}</span>:
              {loadingHourlyVolume && mangoAccountAddress ? (
                <SheenLoader className="ml-1">
                  <div className="h-3.5 w-10 bg-th-bkg-2" />
                </SheenLoader>
              ) : (
                <span className="ml-1 font-mono text-th-fgd-2">
                  <FormatNumericValue
                    value={dailyVolume}
                    decimals={2}
                    isUsd={true}
                  />
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="col-span-6 border-t border-th-bkg-3 py-3 pl-6 pr-4 text-left md:col-span-3 lg:col-span-2 lg:border-l 2xl:col-span-1 2xl:border-t-0">
          <div id="account-step-eight">
            <div className="flex w-full items-center justify-between">
              <Tooltip
                content={t('account:tooltip-total-interest')}
                maxWidth="20rem"
                placement="top-start"
                delay={100}
              >
                <p className="tooltip-underline">
                  {t('total-interest-earned')}
                </p>
              </Tooltip>
              {mangoAccountAddress ? (
                <Tooltip
                  className="hidden md:block"
                  content={t('account:cumulative-interest-chart')}
                  delay={100}
                >
                  <IconButton
                    className="text-th-fgd-3"
                    hideBg
                    onClick={() =>
                      handleViewChange('cumulative-interest-value')
                    }
                  >
                    <ChartBarIcon className="h-5 w-5" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </div>
            <p className="mb-0.5 mt-1 text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              <FormatNumericValue
                value={interestTotalValue}
                decimals={2}
                isUsd={true}
              />
            </p>
            <div className="flex space-x-1.5">
              <Change change={oneDayInterestChange} prefix="$" size="small" />
              <p className="text-xs text-th-fgd-4">{t('rolling-change')}</p>
            </div>
          </div>
        </div>
        <div className="col-span-6 border-t border-th-bkg-3 py-3 pl-6 pr-4 text-left md:col-span-3 md:border-l lg:col-span-2 2xl:col-span-1 2xl:border-t-0">
          <div className="flex w-full items-center justify-between">
            <Tooltip
              content={t('account:tooltip-total-funding')}
              maxWidth="20rem"
              placement="top-start"
              delay={100}
            >
              <p className="tooltip-underline">
                {t('account:total-funding-earned')}
              </p>
            </Tooltip>
            {mangoAccountAddress ? (
              <Tooltip
                className="hidden md:block"
                content={t('account:funding-chart')}
                delay={100}
              >
                <IconButton
                  className="text-th-fgd-3"
                  hideBg
                  onClick={() => handleViewChange('hourly-funding')}
                >
                  <ChartBarIcon className="h-5 w-5" />
                </IconButton>
              </Tooltip>
            ) : null}
          </div>
          {(loadingFunding || fetchingFunding) && mangoAccountAddress ? (
            <SheenLoader className="mt-2">
              <div className="h-7 w-16 bg-th-bkg-2" />
            </SheenLoader>
          ) : (
            <p className="mb-0.5 mt-1 text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              <FormatNumericValue
                value={fundingTotalValue}
                decimals={2}
                isUsd={true}
              />
            </p>
          )}
        </div>
      </div>
    </>
  )
}

export default AccountHeroStats
