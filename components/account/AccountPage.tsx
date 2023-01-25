import {
  HealthType,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useEffect, useMemo, useState } from 'react'
import AccountActions from './AccountActions'
import mangoStore, { PerformanceDataItem } from '@store/mangoStore'
import { formatDecimal, formatFixedDecimals } from '../../utils/numbers'
import FlipNumbers from 'react-flip-numbers'
import dynamic from 'next/dynamic'
const SimpleAreaChart = dynamic(
  () => import('@components/shared/SimpleAreaChart'),
  { ssr: false }
)
import { COLORS } from '../../styles/colors'
import { useTheme } from 'next-themes'
import { IconButton } from '../shared/Button'
import {
  ArrowsPointingOutIcon,
  ChartBarIcon,
  ClockIcon,
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
  // IS_ONBOARDED_KEY
} from 'utils/constants'
import { useWallet } from '@solana/wallet-adapter-react'
import useLocalStorageState from 'hooks/useLocalStorageState'
// import AccountOnboardingTour from '@components/tours/AccountOnboardingTour'
import dayjs from 'dayjs'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import useMangoGroup from 'hooks/useMangoGroup'
import PnlHistoryModal from '@components/modals/PnlHistoryModal'

const AccountPage = () => {
  const { t } = useTranslation(['common', 'account'])
  const { connected } = useWallet()
  const { group } = useMangoGroup()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const actions = mangoStore.getState().actions
  const performanceInitialLoad = mangoStore(
    (s) => s.mangoAccount.performance.initialLoad
  )
  const performanceData = mangoStore((s) => s.mangoAccount.performance.data)
  const totalInterestData = mangoStore(
    (s) => s.mangoAccount.interestTotals.data
  )
  const [chartToShow, setChartToShow] = useState<
    'account-value' | 'cumulative-interest-value' | 'pnl' | ''
  >('')
  const [oneDayPerformanceData, setOneDayPerformanceData] = useState<
    PerformanceDataItem[]
  >([])
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

  useEffect(() => {
    if (mangoAccountAddress || (connected && !mangoAccountAddress)) {
      const set = mangoStore.getState().set
      set((s) => {
        s.mangoAccount.performance.initialLoad = false
      })
      setOneDayPerformanceData([])
      actions.fetchAccountPerformance(mangoAccountAddress, 1)
      actions.fetchAccountInterestTotals(mangoAccountAddress)
    }
  }, [actions, connected, mangoAccountAddress])

  useEffect(() => {
    if (
      performanceData.length &&
      performanceInitialLoad &&
      !oneDayPerformanceData.length
    ) {
      setOneDayPerformanceData(performanceData)
    }
  }, [performanceInitialLoad, oneDayPerformanceData, performanceData])

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
    const set = mangoStore.getState().set
    set((s) => {
      s.mangoAccount.performance.data = oneDayPerformanceData
    })
    setChartToShow('')
  }

  const handleCloseDailyPnlModal = () => {
    const set = mangoStore.getState().set
    set((s) => {
      s.mangoAccount.performance.data = oneDayPerformanceData
    })
    setShowPnlHistory(false)
  }

  const accountValue = useMemo(() => {
    if (!group || !mangoAccount) return 0.0
    return toUiDecimalsForQuote(mangoAccount.getEquity(group).toNumber())
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

  const [accountPnl, accountValueChange, oneDayPnlChange] = useMemo(() => {
    if (
      accountValue &&
      oneDayPerformanceData.length &&
      performanceData.length
    ) {
      const accountPnl = performanceData[performanceData.length - 1].pnl
      const accountValueChange =
        accountValue - oneDayPerformanceData[0].account_equity
      const startDayPnl = oneDayPerformanceData[0].pnl
      const endDayPnl =
        oneDayPerformanceData[oneDayPerformanceData.length - 1].pnl
      const oneDayPnlChange = endDayPnl - startDayPnl

      return [accountPnl, accountValueChange, oneDayPnlChange]
    }
    return [0, 0, 0]
  }, [accountValue, oneDayPerformanceData, performanceData])

  const interestTotalValue = useMemo(() => {
    if (totalInterestData.length) {
      return totalInterestData.reduce(
        (a, c) => a + c.borrow_interest_usd + c.deposit_interest_usd,
        0
      )
    }
    return 0.0
  }, [totalInterestData])

  const oneDayInterestChange = useMemo(() => {
    if (oneDayPerformanceData.length) {
      const startDayInterest =
        oneDayPerformanceData[0].borrow_interest_cumulative_usd +
        oneDayPerformanceData[0].deposit_interest_cumulative_usd

      const latest = oneDayPerformanceData.length - 1

      const endDayInterest =
        oneDayPerformanceData[latest].borrow_interest_cumulative_usd +
        oneDayPerformanceData[latest].deposit_interest_cumulative_usd

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
    chartName: 'pnl' | 'cumulative-interest-value'
  ) => {
    if (
      (chartName === 'cumulative-interest-value' && interestTotalValue > 1) ||
      interestTotalValue < -1
    ) {
      setChartToShow(chartName)
    }
    if (chartName === 'pnl' && performanceData.length > 4) {
      setChartToShow(chartName)
    }
  }

  const latestAccountData = useMemo(() => {
    if (!accountValue || !performanceData.length) return []
    const latestIndex = performanceData.length - 1
    return [
      {
        account_equity: accountValue,
        time: dayjs(Date.now()).toISOString(),
        borrow_interest_cumulative_usd:
          performanceData[latestIndex].borrow_interest_cumulative_usd,
        deposit_interest_cumulative_usd:
          performanceData[latestIndex].deposit_interest_cumulative_usd,
        pnl: performanceData[latestIndex].pnl,
        spot_value: performanceData[latestIndex].spot_value,
        transfer_balance: performanceData[latestIndex].transfer_balance,
      },
    ]
  }, [accountValue, performanceData])

  return !chartToShow ? (
    <>
      <div className="flex flex-col border-b-0 border-th-bkg-3 px-6 py-3 lg:flex-row lg:items-center lg:justify-between lg:border-b">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
          <div id="account-step-three">
            <Tooltip
              maxWidth="20rem"
              placement="bottom-start"
              content="The value of your assets (deposits) minus the value of your liabilities (borrows)."
              delay={250}
            >
              <p className="tooltip-underline mb-2 text-base">
                {t('account-value')}
              </p>
            </Tooltip>
            <div className="mb-2 flex items-center font-display text-5xl text-th-fgd-1">
              {animationSettings['number-scroll'] ? (
                group && mangoAccount ? (
                  <FlipNumbers
                    height={48}
                    width={35}
                    play
                    delay={0.05}
                    duration={1}
                    numbers={formatFixedDecimals(accountValue, true, true)}
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
                <span>{formatFixedDecimals(accountValue, true, true)}</span>
              )}
            </div>
            <div className="flex items-center space-x-1.5">
              <Change
                change={Number(formatDecimal(accountValueChange, 2))}
                prefix="$"
              />
              <p className="text-th-fgd-4">{t('today')}</p>
            </div>
          </div>
          {performanceInitialLoad ? (
            oneDayPerformanceData.length ? (
              <div
                className="relative mt-4 flex h-40 items-end md:mt-0 md:h-24 md:w-48"
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
              <div className="h-40 w-full rounded-md bg-th-bkg-2 md:h-24 md:w-48" />
            </SheenLoader>
          ) : null}
        </div>
        <div className="mt-6 mb-1 lg:mt-0 lg:mb-0">
          <AccountActions />
        </div>
      </div>
      <div className="grid grid-cols-5 border-b border-th-bkg-3">
        <div className="col-span-5 flex border-t border-th-bkg-3 py-3 pl-6 lg:col-span-1 lg:border-t-0">
          <div id="account-step-four">
            <Tooltip
              maxWidth="20rem"
              placement="bottom-start"
              delay={250}
              content={
                <div className="flex-col space-y-2 text-sm">
                  <p className="text-xs">
                    Health describes how close your account is to liquidation.
                    The lower your account health is the more likely you are to
                    get liquidated when prices fluctuate.
                  </p>
                  <p className="text-xs font-bold text-th-fgd-1">
                    Your account health is {maintHealth}%
                  </p>
                  <p className="text-xs">
                    <span className="font-bold text-th-fgd-1">Scenario:</span>{' '}
                    If the prices of all your liabilities increase by{' '}
                    {maintHealth}%, even for just a moment, some of your
                    liabilities will be liquidated.
                  </p>
                  <p className="text-xs">
                    <span className="font-bold text-th-fgd-1">Scenario:</span>{' '}
                    If the value of your total collateral decreases by{' '}
                    {((1 - 1 / ((maintHealth || 0) / 100 + 1)) * 100).toFixed(
                      2
                    )}
                    % , some of your liabilities will be liquidated.
                  </p>
                  <p className="text-xs">
                    These are examples. A combination of events can also lead to
                    liquidation.
                  </p>
                </div>
              }
            >
              <p className="tooltip-underline text-sm font-normal text-th-fgd-3 xl:text-base">
                {t('health')}
              </p>
            </Tooltip>
            <p className="mt-1 text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              {maintHealth}%
            </p>
          </div>
        </div>
        <div className="col-span-5 flex border-t border-th-bkg-3 py-3 pl-6 lg:col-span-1 lg:border-l lg:border-t-0">
          <div id="account-step-five">
            <Tooltip
              content={t('account:tooltip-free-collateral')}
              maxWidth="20rem"
              placement="bottom"
              delay={250}
            >
              <p className="tooltip-underline text-sm text-th-fgd-3 xl:text-base">
                {t('free-collateral')}
              </p>
            </Tooltip>
            <p className="mt-1 mb-0.5 text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              {group && mangoAccount
                ? formatFixedDecimals(
                    toUiDecimalsForQuote(
                      mangoAccount.getCollateralValue(group).toNumber()
                    ),
                    false,
                    true
                  )
                : `$${(0).toFixed(2)}`}
            </p>
            <span className="text-xs font-normal text-th-fgd-4">
              <Tooltip
                content={t('account:tooltip-total-collateral')}
                maxWidth="20rem"
                placement="bottom"
                delay={250}
              >
                <span className="tooltip-underline">{t('total')}</span>:
                <span className="ml-1 font-mono text-th-fgd-2">
                  {group && mangoAccount
                    ? formatFixedDecimals(
                        toUiDecimalsForQuote(
                          mangoAccount
                            .getAssetsValue(group, HealthType.init)
                            .toNumber()
                        ),
                        false,
                        true
                      )
                    : `$${(0).toFixed(2)}`}
                </span>
              </Tooltip>
            </span>
          </div>
        </div>
        <div className="col-span-5 flex border-t border-th-bkg-3 py-3 pl-6 lg:col-span-1 lg:border-l lg:border-t-0">
          <div id="account-step-six">
            <Tooltip
              content={t('account:tooltip-leverage')}
              maxWidth="20rem"
              placement="bottom"
              delay={250}
            >
              <p className="tooltip-underline text-sm text-th-fgd-3 xl:text-base">
                {t('leverage')}
              </p>
            </Tooltip>
            <p className="mt-1 text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              {leverage.toFixed(2)}x
            </p>
          </div>
        </div>
        <div className="col-span-5 border-t border-th-bkg-3 py-3 pl-6 pr-4 lg:col-span-1 lg:border-l lg:border-t-0">
          <div id="account-step-seven" className="flex flex-col items-start">
            <div className="flex w-full items-center justify-between">
              <Tooltip
                content={t('account:tooltip-pnl')}
                placement="bottom"
                delay={250}
              >
                <p className="tooltip-underline inline text-sm text-th-fgd-3 xl:text-base">
                  {t('pnl')}
                </p>
              </Tooltip>
              {mangoAccountAddress ? (
                <div className="flex items-center space-x-3">
                  {performanceData.length > 4 ? (
                    <Tooltip content={t('account:pnl-chart')} delay={250}>
                      <IconButton
                        className="text-th-fgd-3"
                        hideBg
                        onClick={() => handleChartToShow('pnl')}
                      >
                        <ChartBarIcon className="h-5 w-5" />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                  <Tooltip content={t('account:pnl-history')} delay={250}>
                    <IconButton
                      className="text-th-fgd-3"
                      hideBg
                      onClick={() => setShowPnlHistory(true)}
                    >
                      <ClockIcon className="h-5 w-5" />
                    </IconButton>
                  </Tooltip>
                </div>
              ) : null}
            </div>
            <p className="mt-1 mb-0.5 text-left text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              {formatFixedDecimals(accountPnl, true, true)}
            </p>
            <div className="flex space-x-1">
              <Change
                change={Number(formatDecimal(oneDayPnlChange, 2))}
                prefix="$"
                size="small"
              />
              <p className="text-xs text-th-fgd-4">{t('today')}</p>
            </div>
          </div>
        </div>
        <div className="col-span-5 border-t border-th-bkg-3 py-3 pl-6 pr-4 text-left lg:col-span-1 lg:border-l lg:border-t-0">
          <div id="account-step-eight">
            <div className="flex w-full items-center justify-between">
              <Tooltip
                content={t('account:tooltip-total-interest')}
                maxWidth="20rem"
                placement="bottom-end"
                delay={250}
              >
                <p className="tooltip-underline text-sm text-th-fgd-3 xl:text-base">
                  {t('total-interest-earned')}
                </p>
              </Tooltip>
              {interestTotalValue > 1 || interestTotalValue < -1 ? (
                <Tooltip content="Cumulative Interest Chart" delay={250}>
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
              {formatFixedDecimals(interestTotalValue, true, true)}
            </p>
            <div className="flex space-x-1">
              <Change
                change={Number(formatDecimal(oneDayInterestChange, 2))}
                prefix="$"
                size="small"
              />
              <p className="text-xs text-th-fgd-4">{t('today')}</p>
            </div>
          </div>
        </div>
      </div>
      <AccountTabs />
      {/* {!tourSettings?.account_tour_seen && isOnBoarded && connected ? (
        <AccountOnboardingTour />
      ) : null} */}
      {showPnlHistory ? (
        <PnlHistoryModal
          pnlChangeToday={oneDayPnlChange}
          isOpen={showPnlHistory}
          onClose={handleCloseDailyPnlModal}
        />
      ) : null}
    </>
  ) : (
    <div className="p-6 pb-0">
      {chartToShow === 'account-value' ? (
        <AccountChart
          chartToShow="account-value"
          hideChart={handleHideChart}
          mangoAccountAddress={mangoAccountAddress}
          yKey="account_equity"
        />
      ) : chartToShow === 'pnl' ? (
        <AccountChart
          chartToShow="pnl"
          hideChart={handleHideChart}
          mangoAccountAddress={mangoAccountAddress}
          yKey="pnl"
        />
      ) : (
        <AccountChart
          chartToShow="cumulative-interest-value"
          hideChart={handleHideChart}
          mangoAccountAddress={mangoAccountAddress}
          yKey="interest_value"
        />
      )}
    </div>
  )
}

export default AccountPage
