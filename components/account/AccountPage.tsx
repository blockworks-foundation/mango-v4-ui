import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import AccountActions from './AccountActions'
import AccountTabs from './AccountTabs'
import AccountChart from './AccountChart'
import useMangoAccount from '../../hooks/useMangoAccount'
import useLocalStorageState from 'hooks/useLocalStorageState'
// import AccountOnboardingTour from '@components/tours/AccountOnboardingTour'
import dayjs from 'dayjs'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import useMangoGroup from 'hooks/useMangoGroup'
import PnlHistoryModal from '@components/modals/PnlHistoryModal'
import AssetsLiabilities from './AssetsLiabilities'
import { PerformanceDataItem } from 'types'
import { useQuery } from '@tanstack/react-query'
import FundingChart from './FundingChart'
import VolumeChart from './VolumeChart'
import { fetchAccountPerformance, fetchHourlyVolume } from 'utils/account'
import AccountHeroStats from './AccountHeroStats'
import AccountValue from './AccountValue'

const TABS = ['account-value', 'account:assets-liabilities']

export type ChartToShow =
  | ''
  | 'account-value'
  | 'cumulative-interest-value'
  | 'pnl'
  | 'hourly-funding'
  | 'hourly-volume'

const AccountPage = () => {
  const { t } = useTranslation(['common', 'account'])
  const { group } = useMangoGroup()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const [chartToShow, setChartToShow] = useState<ChartToShow>('')
  const [showPnlHistory, setShowPnlHistory] = useState<boolean>(false)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  // const tourSettings = mangoStore((s) => s.settings.tours)
  // const [isOnBoarded] = useLocalStorageState(IS_ONBOARDED_KEY)
  const [activeTab, setActiveTab] = useLocalStorageState(
    'accountHeroKey-0.1',
    'account-value'
  )

  const {
    data: performanceData,
    isLoading: loadingPerformanceData,
    isFetching: fetchingPerformanceData,
  } = useQuery(
    ['performance', mangoAccountAddress],
    () => fetchAccountPerformance(mangoAccountAddress, 31),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccountAddress,
    }
  )

  const {
    data: hourlyVolumeData,
    isLoading: loadingHourlyVolumeData,
    isFetching: fetchingHourlyVolumeData,
  } = useQuery(
    ['hourly-volume', mangoAccountAddress],
    () => fetchHourlyVolume(mangoAccountAddress),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccountAddress,
    }
  )

  const rollingDailyData: PerformanceDataItem[] | [] = useMemo(() => {
    if (!performanceData || !performanceData.length) return []
    const nowDate = new Date()
    return performanceData.filter((d) => {
      const dataTime = new Date(d.time).getTime()
      return dataTime >= nowDate.getTime() - 86400000
    })
  }, [performanceData])

  const handleHideChart = () => {
    setChartToShow('')
  }

  const handleCloseDailyPnlModal = () => {
    setShowPnlHistory(false)
  }

  const [accountPnl, accountValue] = useMemo(() => {
    if (!group || !mangoAccount) return [0, 0]
    return [
      toUiDecimalsForQuote(mangoAccount.getPnl(group).toNumber()),
      toUiDecimalsForQuote(mangoAccount.getEquity(group).toNumber()),
    ]
  }, [group, mangoAccount])

  const pnlChangeToday = useMemo(() => {
    if (!accountPnl || !rollingDailyData.length) return 0
    const startHour = rollingDailyData.find((item) => {
      const itemHour = new Date(item.time).getHours()
      return itemHour === 0
    })
    const startDayPnl = startHour?.pnl
    const pnlChangeToday = startDayPnl ? accountPnl - startDayPnl : 0

    return pnlChangeToday
  }, [accountPnl, rollingDailyData])

  const latestAccountData = useMemo(() => {
    if (!accountValue || !performanceData || !performanceData.length) return []
    const latestDataItem = performanceData[performanceData.length - 1]
    return [
      {
        account_equity: accountValue,
        time: dayjs(Date.now()).toISOString(),
        borrow_interest_cumulative_usd:
          latestDataItem.borrow_interest_cumulative_usd,
        deposit_interest_cumulative_usd:
          latestDataItem.deposit_interest_cumulative_usd,
        pnl: accountPnl,
        spot_value: latestDataItem.spot_value,
        transfer_balance: latestDataItem.transfer_balance,
      },
    ]
  }, [accountPnl, accountValue, performanceData])

  const loadingHourlyVolume =
    fetchingHourlyVolumeData || loadingHourlyVolumeData

  const performanceLoading = loadingPerformanceData || fetchingPerformanceData

  return !chartToShow ? (
    <>
      <div className="flex flex-col border-b-0 border-th-bkg-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:border-b">
        <div>
          <div className="hide-scroll flex justify-center space-x-2 md:justify-start">
            {TABS.map((tab) => (
              <button
                className={`rounded-md py-1.5 px-2.5 text-sm font-medium focus-visible:bg-th-bkg-3 focus-visible:text-th-fgd-1 ${
                  activeTab === tab
                    ? 'bg-th-bkg-3 text-th-active md:hover:text-th-active'
                    : 'text-th-fgd-3 md:hover:text-th-fgd-2'
                }`}
                onClick={() => setActiveTab(tab)}
                key={tab}
              >
                {t(tab)}
              </button>
            ))}
          </div>
          <div className="md:h-24">
            {activeTab === 'account-value' ? (
              <AccountValue
                accountValue={accountValue}
                latestAccountData={latestAccountData}
                loading={performanceLoading}
                rollingDailyData={rollingDailyData}
                setChartToShow={setChartToShow}
              />
            ) : null}
            {activeTab === 'account:assets-liabilities' ? (
              <AssetsLiabilities isMobile={isMobile} />
            ) : null}
          </div>
        </div>
        <div className="mt-6 mb-1 lg:mt-0">
          <AccountActions />
        </div>
      </div>
      <AccountHeroStats
        accountPnl={accountPnl}
        accountValue={accountValue}
        hourlyVolumeData={hourlyVolumeData}
        loadingHourlyVolume={loadingHourlyVolume}
        rollingDailyData={rollingDailyData}
        setChartToShow={setChartToShow}
        setShowPnlHistory={setShowPnlHistory}
      />
      <AccountTabs />
      {/* {!tourSettings?.account_tour_seen && isOnBoarded && connected ? (
        <AccountOnboardingTour />
      ) : null} */}
      {showPnlHistory ? (
        <PnlHistoryModal
          loading={performanceLoading}
          performanceData={performanceData}
          pnlChangeToday={pnlChangeToday}
          isOpen={showPnlHistory}
          onClose={handleCloseDailyPnlModal}
        />
      ) : null}
    </>
  ) : (
    <>
      {chartToShow === 'account-value' ? (
        <AccountChart
          chartToShow="account-value"
          setChartToShow={setChartToShow}
          data={performanceData?.concat(latestAccountData)}
          hideChart={handleHideChart}
          yKey="account_equity"
        />
      ) : chartToShow === 'pnl' ? (
        <AccountChart
          chartToShow="pnl"
          setChartToShow={setChartToShow}
          data={performanceData?.concat(latestAccountData)}
          hideChart={handleHideChart}
          yKey="pnl"
        />
      ) : chartToShow === 'hourly-funding' ? (
        <FundingChart hideChart={handleHideChart} />
      ) : chartToShow === 'hourly-volume' ? (
        <VolumeChart
          chartData={hourlyVolumeData}
          hideChart={handleHideChart}
          loading={loadingHourlyVolume}
        />
      ) : (
        <AccountChart
          chartToShow="cumulative-interest-value"
          setChartToShow={setChartToShow}
          data={performanceData}
          hideChart={handleHideChart}
          yKey="interest_value"
        />
      )}
    </>
  )
}

export default AccountPage
