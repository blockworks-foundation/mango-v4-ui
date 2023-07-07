import {
  HealthType,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useEffect, useMemo, useState } from 'react'
import AccountActions from './AccountActions'
import mangoStore from '@store/mangoStore'
import { formatCurrencyValue } from '../../utils/numbers'
import FlipNumbers from 'react-flip-numbers'
import SimpleAreaChart from '@components/shared/SimpleAreaChart'
import { COLORS } from '../../styles/colors'
import { useTheme } from 'next-themes'
import { IconButton } from '../shared/Button'
import {
  ArrowsPointingOutIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/20/solid'
import { Transition } from '@headlessui/react'
import AccountTabs from './AccountTabs'
import SheenLoader from '../shared/SheenLoader'
import AccountChart from './AccountChart'
import useMangoAccount from '../../hooks/useMangoAccount'
import Change from '../shared/Change'
import Tooltip from '@components/shared/Tooltip'
import {
  ANIMATION_SETTINGS_KEY,
  MANGO_DATA_API_URL,
  // IS_ONBOARDED_KEY
} from 'utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'
// import AccountOnboardingTour from '@components/tours/AccountOnboardingTour'
import dayjs from 'dayjs'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import useMangoGroup from 'hooks/useMangoGroup'
import PnlHistoryModal from '@components/modals/PnlHistoryModal'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import HealthBar from './HealthBar'
import AssetsLiabilities from './AssetsLiabilities'
import {
  AccountPerformanceData,
  AccountVolumeTotalData,
  EmptyObject,
  FormattedHourlyAccountVolumeData,
  HourlyAccountVolumeData,
  PerformanceDataItem,
  TotalAccountFundingItem,
} from 'types'
import { useQuery } from '@tanstack/react-query'
import FundingChart from './FundingChart'
import VolumeChart from './VolumeChart'

const TABS = ['account-value', 'account:assets-liabilities']

const fetchAccountPerformance = async (
  mangoAccountPk: string,
  range: number
) => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/stats/performance_account?mango-account=${mangoAccountPk}&start-date=${dayjs()
        .subtract(range, 'day')
        .format('YYYY-MM-DD')}`
    )
    const parsedResponse: null | EmptyObject | AccountPerformanceData[] =
      await response.json()
    if (parsedResponse && Object.keys(parsedResponse)?.length) {
      const entries = Object.entries(parsedResponse).sort((a, b) =>
        b[0].localeCompare(a[0])
      )
      const stats = entries.map(([key, value]) => {
        return { ...value, time: key } as PerformanceDataItem
      })

      return stats.reverse()
    } else return []
  } catch (e) {
    console.error('Failed to load account performance data', e)
    return []
  }
}

const fetchFundingTotals = async (mangoAccountPk: string) => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/stats/funding-account-total?mango-account=${mangoAccountPk}`
    )
    const res = await data.json()
    if (res) {
      const entries: [string, Omit<TotalAccountFundingItem, 'market'>][] =
        Object.entries(res)

      const stats: TotalAccountFundingItem[] = entries
        .map(([key, value]) => {
          return {
            long_funding: value.long_funding * -1,
            short_funding: value.short_funding * -1,
            market: key,
          }
        })
        .filter((x) => x)

      return stats
    }
  } catch (e) {
    console.log('Failed to fetch account funding', e)
  }
}

const fetchVolumeTotals = async (mangoAccountPk: string) => {
  try {
    const [perpTotal, spotTotal] = await Promise.all([
      fetch(
        `${MANGO_DATA_API_URL}/stats/perp-volume-total?mango-account=${mangoAccountPk}`
      ),
      fetch(
        `${MANGO_DATA_API_URL}/stats/spot-volume-total?mango-account=${mangoAccountPk}`
      ),
    ])

    const [perpTotalData, spotTotalData] = await Promise.all([
      perpTotal.json(),
      spotTotal.json(),
    ])

    const combinedData = [perpTotalData, spotTotalData]
    if (combinedData.length) {
      return combinedData.reduce((a, c) => {
        const entries: AccountVolumeTotalData[] = Object.entries(c)
        const marketVol = entries.reduce((a, c) => {
          return a + c[1].volume_usd
        }, 0)
        return a + marketVol
      }, 0)
    }
    return 0
  } catch (e) {
    console.log('Failed to fetch spot volume', e)
    return 0
  }
}

const formatHourlyVolumeData = (data: HourlyAccountVolumeData[]) => {
  if (!data || !data.length) return []
  const formattedData: FormattedHourlyAccountVolumeData[] = []

  // Loop through each object in the original data array
  for (const obj of data) {
    // Loop through the keys (markets) in each object
    for (const market in obj) {
      // Loop through the timestamps in each market
      for (const timestamp in obj[market]) {
        // Find the corresponding entry in the formatted data array based on the timestamp
        let entry = formattedData.find((item) => item.time === timestamp)

        // If the entry doesn't exist, create a new entry
        if (!entry) {
          entry = { time: timestamp, total_volume_usd: 0, markets: {} }
          formattedData.push(entry)
        }

        // Increment the total_volume_usd by the volume_usd value
        entry.total_volume_usd += obj[market][timestamp].volume_usd

        // Add or update the market entry in the markets object
        entry.markets[market] = obj[market][timestamp].volume_usd
      }
    }
  }

  return formattedData
}

const fetchHourlyVolume = async (mangoAccountPk: string) => {
  try {
    const [perpHourly, spotHourly] = await Promise.all([
      fetch(
        `${MANGO_DATA_API_URL}/stats/perp-volume-hourly?mango-account=${mangoAccountPk}`
      ),
      fetch(
        `${MANGO_DATA_API_URL}/stats/spot-volume-hourly?mango-account=${mangoAccountPk}`
      ),
    ])

    const [perpHourlyData, spotHourlyData] = await Promise.all([
      perpHourly.json(),
      spotHourly.json(),
    ])
    const hourlyVolume = [perpHourlyData, spotHourlyData]
    return formatHourlyVolumeData(hourlyVolume)
  } catch (e) {
    console.log('Failed to fetch spot volume', e)
  }
}

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

  const totalInterestData = mangoStore(
    (s) => s.mangoAccount.interestTotals.data
  )
  const [chartToShow, setChartToShow] = useState<ChartToShow>('')
  const [showExpandChart, setShowExpandChart] = useState<boolean>(false)
  const [showPnlHistory, setShowPnlHistory] = useState<boolean>(false)
  const { theme } = useTheme()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  // const tourSettings = mangoStore((s) => s.settings.tours)
  // const [isOnBoarded] = useLocalStorageState(IS_ONBOARDED_KEY)
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS
  )
  const [activeTab, setActiveTab] = useLocalStorageState(
    'accountHeroKey-0.1',
    'account-value'
  )

  useEffect(() => {
    if (mangoAccountAddress) {
      const actions = mangoStore.getState().actions
      actions.fetchAccountInterestTotals(mangoAccountAddress)
    }
  }, [mangoAccountAddress])

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
    }
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

  const oneDayPerformanceData: PerformanceDataItem[] | [] = useMemo(() => {
    if (!performanceData || !performanceData.length) return []
    const nowDate = new Date()
    return performanceData.filter((d) => {
      const dataTime = new Date(d.time).getTime()
      return dataTime >= nowDate.getTime() - 86400000
    })
  }, [performanceData])

  const onHoverMenu = (open: boolean, action: string) => {
    if (
      (!open && action === 'onMouseEnter') ||
      (open && action === 'onMouseLeave')
    ) {
      setShowExpandChart(!open)
    }
  }

  const handleShowAccountValueChart = () => {
    setChartToShow('account-value')
    setShowExpandChart(false)
  }

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

  const leverage = useMemo(() => {
    if (!group || !mangoAccount) return 0
    const assetsValue = toUiDecimalsForQuote(
      mangoAccount.getAssetsValue(group).toNumber()
    )

    if (isNaN(assetsValue / accountValue)) {
      return 0
    } else {
      return Math.abs(1 - assetsValue / accountValue)
    }
  }, [mangoAccount, group, accountValue])

  const [accountValueChange, oneDayPnlChange] = useMemo(() => {
    if (
      accountValue &&
      oneDayPerformanceData.length &&
      performanceData &&
      performanceData.length
    ) {
      const accountValueChange =
        accountValue - oneDayPerformanceData[0].account_equity
      const startDayPnl = oneDayPerformanceData[0].pnl
      const endDayPnl =
        oneDayPerformanceData[oneDayPerformanceData.length - 1].pnl
      const oneDayPnlChange = endDayPnl - startDayPnl

      return [accountValueChange, oneDayPnlChange]
    }
    return [0, 0]
  }, [accountValue, oneDayPerformanceData, performanceData])

  const interestTotalValue = useMemo(() => {
    if (totalInterestData.length) {
      return totalInterestData.reduce(
        (a, c) => a + (c.borrow_interest_usd * -1 + c.deposit_interest_usd),
        0
      )
    }
    return 0.0
  }, [totalInterestData])

  const fundingTotalValue = useMemo(() => {
    if (fundingData?.length && mangoAccountAddress) {
      return fundingData.reduce(
        (a, c) => a + c.long_funding + c.short_funding,
        0
      )
    }
    return 0.0
  }, [fundingData, mangoAccountAddress])

  const oneDayInterestChange = useMemo(() => {
    if (oneDayPerformanceData.length) {
      const first = oneDayPerformanceData[0]
      const latest = oneDayPerformanceData[oneDayPerformanceData.length - 1]

      const startDayInterest =
        first.borrow_interest_cumulative_usd +
        first.deposit_interest_cumulative_usd

      const endDayInterest =
        latest.borrow_interest_cumulative_usd +
        latest.deposit_interest_cumulative_usd

      return endDayInterest - startDayInterest
    }
    return 0.0
  }, [oneDayPerformanceData])

  const maintHealth = useMemo(() => {
    return group && mangoAccount
      ? mangoAccount.getHealthRatioUi(group, HealthType.maint)
      : 0
  }, [mangoAccount, group])

  const handleChartToShow = (
    chartName:
      | 'pnl'
      | 'cumulative-interest-value'
      | 'hourly-funding'
      | 'hourly-volume'
  ) => {
    setChartToShow(chartName)
  }

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

  const loadingTotalVolume = fetchingVolumeTotalData || loadingVolumeTotalData
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
              <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
                <div className="mx-auto mt-4 md:mx-0">
                  <div className="mb-2 flex justify-start font-display text-5xl text-th-fgd-1">
                    {animationSettings['number-scroll'] ? (
                      group && mangoAccount ? (
                        <FlipNumbers
                          height={48}
                          width={35}
                          play
                          delay={0.05}
                          duration={1}
                          numbers={formatCurrencyValue(accountValue, 2)}
                        />
                      ) : (
                        <FlipNumbers
                          height={48}
                          width={36}
                          play
                          delay={0.05}
                          duration={1}
                          numbers={'$0.00'}
                        />
                      )
                    ) : (
                      <FormatNumericValue
                        value={accountValue}
                        isUsd
                        decimals={2}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-center space-x-1.5 md:justify-start">
                    <Change change={accountValueChange} prefix="$" />
                    <p className="text-xs text-th-fgd-4">
                      {t('rolling-change')}
                    </p>
                  </div>
                </div>
                {!performanceLoading ? (
                  oneDayPerformanceData.length ? (
                    <div
                      className="relative mt-4 flex h-40 items-end md:mt-0 md:h-20 md:w-52 lg:w-60"
                      onMouseEnter={() =>
                        onHoverMenu(showExpandChart, 'onMouseEnter')
                      }
                      onMouseLeave={() =>
                        onHoverMenu(showExpandChart, 'onMouseLeave')
                      }
                    >
                      <SimpleAreaChart
                        color={
                          accountValueChange >= 0
                            ? COLORS.UP[theme]
                            : COLORS.DOWN[theme]
                        }
                        data={oneDayPerformanceData.concat(latestAccountData)}
                        name="accountValue"
                        xKey="time"
                        yKey="account_equity"
                      />
                      <Transition
                        appear={true}
                        className="absolute right-2 bottom-2"
                        show={showExpandChart || isMobile}
                        enter="transition ease-in duration-300"
                        enterFrom="opacity-0 scale-75"
                        enterTo="opacity-100 scale-100"
                        leave="transition ease-out duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <IconButton
                          className="text-th-fgd-3"
                          hideBg
                          onClick={() => handleShowAccountValueChart()}
                        >
                          <ArrowsPointingOutIcon className="h-5 w-5" />
                        </IconButton>
                      </Transition>
                    </div>
                  ) : null
                ) : mangoAccountAddress ? (
                  <SheenLoader className="mt-4 flex flex-1 md:mt-0">
                    <div className="h-40 w-full rounded-md bg-th-bkg-2 md:h-20 md:w-52 lg:w-60" />
                  </SheenLoader>
                ) : null}
              </div>
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
      <div className="grid grid-cols-6 border-b border-th-bkg-3">
        <div className="col-span-6 border-t border-th-bkg-3 py-3 px-6 md:col-span-3 lg:col-span-2 lg:border-t-0 xl:col-span-1">
          <div id="account-step-four">
            <Tooltip
              maxWidth="20rem"
              placement="top-start"
              delay={100}
              content={
                <div className="flex-col space-y-2 text-sm">
                  <p className="text-xs">
                    Health describes how close your account is to liquidation.
                    The lower your account health is the more likely you are to
                    get liquidated when prices fluctuate.
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
              <p className="tooltip-underline text-sm font-normal text-th-fgd-3 xl:text-base">
                {t('health')}
              </p>
            </Tooltip>
            <div className="mt-1 mb-0.5 flex items-center space-x-3">
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
        <div className="col-span-6 flex border-t border-th-bkg-3 py-3 pl-6 md:col-span-3 md:border-l lg:col-span-2 lg:border-t-0 xl:col-span-1">
          <div id="account-step-five">
            <Tooltip
              content={t('account:tooltip-free-collateral')}
              maxWidth="20rem"
              placement="top-start"
              delay={100}
            >
              <p className="tooltip-underline text-sm text-th-fgd-3 xl:text-base">
                {t('free-collateral')}
              </p>
            </Tooltip>
            <p className="mt-1 mb-0.5 text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              <FormatNumericValue
                value={
                  group && mangoAccount
                    ? toUiDecimalsForQuote(
                        mangoAccount.getCollateralValue(group)
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
                            mangoAccount.getAssetsValue(group, HealthType.init)
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
        <div className="col-span-6 flex border-t border-th-bkg-3 py-3 px-6 md:col-span-3 lg:col-span-2 lg:border-l lg:border-t-0 xl:col-span-1">
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
                <p className="tooltip-underline inline text-sm text-th-fgd-3 xl:text-base">
                  {t('pnl')}
                </p>
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
                      onClick={() => handleChartToShow('pnl')}
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
            <p className="mt-1 mb-0.5 text-left text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              <FormatNumericValue
                value={accountPnl}
                decimals={2}
                isUsd={true}
              />
            </p>
            <div className="flex space-x-1.5">
              <Change change={oneDayPnlChange} prefix="$" size="small" />
              <p className="text-xs text-th-fgd-4">{t('rolling-change')}</p>
            </div>
          </div>
        </div>
        <div className="col-span-6 border-t border-th-bkg-3 py-3 pl-6 pr-4 md:col-span-3 md:border-l lg:col-span-2 lg:border-l-0 xl:col-span-1 xl:border-l xl:border-t-0">
          <div id="account-step-six">
            <div className="flex w-full items-center justify-between">
              <p className="text-sm text-th-fgd-3 xl:text-base">
                {t('account:lifetime-volume')}
              </p>
              {mangoAccountAddress ? (
                <Tooltip
                  className="hidden md:block"
                  content={t('account:volume-chart')}
                  delay={100}
                >
                  <IconButton
                    className="text-th-fgd-3"
                    hideBg
                    onClick={() => handleChartToShow('hourly-volume')}
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
        <div className="col-span-6 border-t border-th-bkg-3 py-3 pl-6 pr-4 text-left md:col-span-3 lg:col-span-2 lg:border-l xl:col-span-1 xl:border-t-0">
          <div id="account-step-eight">
            <div className="flex w-full items-center justify-between">
              <Tooltip
                content={t('account:tooltip-total-interest')}
                maxWidth="20rem"
                placement="top-start"
                delay={100}
              >
                <p className="tooltip-underline text-sm text-th-fgd-3 xl:text-base">
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
                      handleChartToShow('cumulative-interest-value')
                    }
                  >
                    <ChartBarIcon className="h-5 w-5" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </div>
            <p className="mt-1 mb-0.5 text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
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
        <div className="col-span-6 border-t border-th-bkg-3 py-3 pl-6 pr-4 text-left md:col-span-3 md:border-l lg:col-span-2 xl:col-span-1 xl:border-t-0">
          <div className="flex w-full items-center justify-between">
            <Tooltip
              content={t('account:tooltip-total-funding')}
              maxWidth="20rem"
              placement="top-start"
              delay={100}
            >
              <p className="tooltip-underline text-sm text-th-fgd-3 xl:text-base">
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
                  onClick={() => handleChartToShow('hourly-funding')}
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
            <p className="mt-1 mb-0.5 text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              <FormatNumericValue
                value={fundingTotalValue}
                decimals={2}
                isUsd={true}
              />
            </p>
          )}
        </div>
      </div>
      <AccountTabs />
      {/* {!tourSettings?.account_tour_seen && isOnBoarded && connected ? (
        <AccountOnboardingTour />
      ) : null} */}
      {showPnlHistory ? (
        <PnlHistoryModal
          loading={performanceLoading}
          performanceData={performanceData}
          pnlChangeToday={oneDayPnlChange}
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
