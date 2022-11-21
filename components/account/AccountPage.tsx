import {
  HealthType,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useEffect, useMemo, useState } from 'react'
import AccountActions from './AccountActions'
import DepositModal from '../modals/DepositModal'
import WithdrawModal from '../modals/WithdrawModal'
import mangoStore, { PerformanceDataItem } from '@store/mangoStore'
import { formatFixedDecimals } from '../../utils/numbers'
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
  ChevronRightIcon,
} from '@heroicons/react/20/solid'
import { Transition } from '@headlessui/react'
import AccountTabs from './AccountTabs'
import SheenLoader from '../shared/SheenLoader'
import AccountChart from './AccountChart'
import useMangoAccount from '../../hooks/useMangoAccount'
import Change from '../shared/Change'
import Tooltip from '@components/shared/Tooltip'
import { IS_ONBOARDED_KEY } from 'utils/constants'
import { useWallet } from '@solana/wallet-adapter-react'
import useLocalStorageState from 'hooks/useLocalStorageState'
import AccountOnboardingTour from '@components/tours/AccountOnboardingTour'
import dayjs from 'dayjs'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'close-account',
        'trade',
      ])),
    },
  }
}

const AccountPage = () => {
  const { t } = useTranslation('common')
  const { connected } = useWallet()
  const group = mangoStore.getState().group
  const { mangoAccount } = useMangoAccount()
  const actions = mangoStore((s) => s.actions)
  const loadPerformanceData = mangoStore(
    (s) => s.mangoAccount.stats.performance.loading
  )
  const performanceData = mangoStore(
    (s) => s.mangoAccount.stats.performance.data
  )
  const totalInterestData = mangoStore(
    (s) => s.mangoAccount.stats.interestTotals.data
  )
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false)
  const [chartToShow, setChartToShow] = useState<
    'account-value' | 'cumulative-interest-value' | 'pnl' | ''
  >('')
  const [oneDayPerformanceData, setOneDayPerformanceData] = useState<
    PerformanceDataItem[]
  >([])
  const [showExpandChart, setShowExpandChart] = useState<boolean>(false)
  const { theme } = useTheme()
  const tourSettings = mangoStore((s) => s.settings.tours)
  const [isOnBoarded] = useLocalStorageState(IS_ONBOARDED_KEY)

  const leverage = useMemo(() => {
    if (!group || !mangoAccount) return 0
    const liabsValue = mangoAccount
      .getLiabsValue(group, HealthType.init)!
      .toNumber()
    const totalCollateral = mangoAccount
      .getAssetsValue(group, HealthType.init)!
      .toNumber()

    if (isNaN(liabsValue / totalCollateral)) {
      return 0
    } else return liabsValue / totalCollateral
  }, [mangoAccount, group])

  useEffect(() => {
    if (mangoAccount) {
      const pubKey = mangoAccount.publicKey.toString()
      actions.fetchAccountPerformance(pubKey, 1)
      actions.fetchAccountInterestTotals(pubKey)
    }
  }, [actions, mangoAccount])

  useEffect(() => {
    if (mangoAccount && performanceData.length && !chartToShow) {
      setOneDayPerformanceData(performanceData)
    }
  }, [mangoAccount, performanceData, chartToShow])

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
      s.mangoAccount.stats.performance.data = oneDayPerformanceData
    })
    setChartToShow('')
  }

  const accountValue = useMemo(() => {
    if (!group || !mangoAccount) return 0.0
    return toUiDecimalsForQuote(mangoAccount.getEquity(group)!.toNumber())
  }, [group, mangoAccount])

  const { accountPnl, accountValueChange } = useMemo(() => {
    if (accountValue && performanceData.length) {
      return {
        accountPnl: performanceData[performanceData.length - 1].pnl,
        accountValueChange: accountValue - performanceData[0].account_equity,
      }
    }
    return { accountPnl: 0, accountValueChange: 0 }
  }, [accountValue, performanceData])

  const oneDayPnlChange = useMemo(() => {
    if (accountPnl && oneDayPerformanceData.length) {
      const startDayPnl = oneDayPerformanceData[0].pnl
      return accountPnl - startDayPnl
    }
    return 0.0
  }, [accountPnl, oneDayPerformanceData])

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
    if (oneDayPerformanceData.length && mangoAccount) {
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
  }, [oneDayPerformanceData, mangoAccount])

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
      <div className="flex flex-wrap items-center justify-between border-b-0 border-th-bkg-3 px-6 py-3 md:border-b">
        <div className="flex items-center space-x-6">
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
            <div className="mb-2 flex items-center text-5xl font-bold text-th-fgd-1">
              {group && mangoAccount ? (
                <FlipNumbers
                  height={48}
                  width={32}
                  play
                  delay={0.05}
                  duration={1}
                  numbers={formatFixedDecimals(accountValue, true)}
                />
              ) : (
                <FlipNumbers
                  height={48}
                  width={32}
                  play
                  delay={0.05}
                  duration={1}
                  numbers={'$0.00'}
                />
              )}
            </div>
            <div className="flex items-center space-x-1.5">
              <Change change={accountValueChange} isCurrency />
              <p className="text-th-fgd-4">{t('today')}</p>
            </div>
          </div>
          {!loadPerformanceData ? (
            mangoAccount && performanceData.length ? (
              <div
                className="relative flex items-end"
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
                      ? COLORS.GREEN[theme]
                      : COLORS.RED[theme]
                  }
                  data={performanceData.concat(latestAccountData)}
                  height={88}
                  name="accountValue"
                  width={180}
                  xKey="time"
                  yKey="account_equity"
                />
                <Transition
                  appear={true}
                  className="absolute right-2 bottom-2"
                  show={showExpandChart}
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
          ) : (
            <SheenLoader>
              <div className="h-[88px] w-[180px] rounded-md bg-th-bkg-2" />
            </SheenLoader>
          )}
        </div>
        <div className="mt-3 mb-1 lg:mt-0 lg:mb-0">
          <AccountActions />
        </div>
      </div>
      <div className="grid grid-cols-5 border-b border-th-bkg-3">
        <div className="col-span-5 flex border-t border-th-bkg-3 py-3 pl-6 md:border-t-0 lg:col-span-1">
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
              <p className="tooltip-underline text-sm text-th-fgd-3 xl:text-base">
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
              content="The value of collateral you have to open new trades or borrows. When your free collateral reaches $0 you won't be able to make withdrawals."
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
                      mangoAccount.getCollateralValue(group)!.toNumber()
                    ),
                    true
                  )
                : (0).toFixed(2)}
            </p>
            <span className="text-xs font-normal text-th-fgd-4">
              <Tooltip
                content="Total value of collateral for trading and borrowing (including unsettled PnL)."
                maxWidth="20rem"
                placement="bottom"
                delay={250}
              >
                <span className="tooltip-underline">Total</span>:
                <span className="ml-1 font-mono text-th-fgd-2">
                  {group && mangoAccount
                    ? formatFixedDecimals(
                        toUiDecimalsForQuote(
                          mangoAccount
                            .getAssetsValue(group, HealthType.init)!
                            .toNumber()
                        ),
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
              content="Total position size divided by total collateral."
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
        <button
          className={`col-span-5 flex items-center justify-between border-t border-th-bkg-3 py-3 pl-6 pr-4 lg:col-span-1 lg:border-l lg:border-t-0 ${
            performanceData.length > 4
              ? 'default-transition cursor-pointer md:hover:bg-th-bkg-2'
              : 'cursor-default'
          }`}
          onClick={() => handleChartToShow('pnl')}
        >
          <div id="account-step-seven" className="flex flex-col items-start">
            <Tooltip
              content="The amount your account has made or lost."
              placement="bottom"
              delay={250}
            >
              <p className="tooltip-underline inline text-sm text-th-fgd-3 xl:text-base">
                {t('pnl')}
              </p>
            </Tooltip>
            <p className="mt-1 mb-0.5 text-left text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              {formatFixedDecimals(accountPnl, true)}
            </p>
            <div className="flex space-x-1">
              <Change change={oneDayPnlChange} isCurrency size="small" />
              <p className="text-xs text-th-fgd-4">{t('today')}</p>
            </div>
          </div>
          {performanceData.length > 4 ? (
            <ChevronRightIcon className="h-6 w-6" />
          ) : null}
        </button>
        <button
          className={`col-span-5 flex items-center justify-between border-t border-th-bkg-3 py-3 pl-6 pr-4 text-left lg:col-span-1 lg:border-l lg:border-t-0 ${
            interestTotalValue > 1 || interestTotalValue < -1
              ? 'default-transition cursor-pointer md:hover:bg-th-bkg-2'
              : 'cursor-default'
          }`}
          onClick={() => handleChartToShow('cumulative-interest-value')}
        >
          <div id="account-step-eight">
            <Tooltip
              content="The value of interest earned (deposits) minus interest paid (borrows)."
              maxWidth="20rem"
              placement="bottom-end"
              delay={250}
            >
              <p className="tooltip-underline text-sm text-th-fgd-3 xl:text-base">
                {t('total-interest-earned')}
              </p>
            </Tooltip>
            <p className="mt-1 mb-0.5 text-2xl font-bold text-th-fgd-1 lg:text-xl xl:text-2xl">
              {formatFixedDecimals(interestTotalValue, true)}
            </p>
            <div className="flex space-x-1">
              <Change change={oneDayInterestChange} isCurrency size="small" />
              <p className="text-xs text-th-fgd-4">{t('today')}</p>
            </div>
          </div>
          {interestTotalValue > 1 || interestTotalValue < -1 ? (
            <ChevronRightIcon className="-mt-0.5 h-6 w-6" />
          ) : null}
        </button>
      </div>
      <AccountTabs />
      {showDepositModal ? (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
        />
      ) : null}
      {showWithdrawModal ? (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
        />
      ) : null}
      {!tourSettings?.account_tour_seen && isOnBoarded && connected ? (
        <AccountOnboardingTour />
      ) : null}
    </>
  ) : (
    <div className="p-6">
      {chartToShow === 'account-value' ? (
        <AccountChart
          chartToShow="account-value"
          data={performanceData}
          hideChart={handleHideChart}
          mangoAccount={mangoAccount!}
          yKey="account_equity"
        />
      ) : chartToShow === 'pnl' ? (
        <AccountChart
          chartToShow="pnl"
          data={performanceData}
          hideChart={handleHideChart}
          mangoAccount={mangoAccount!}
          yKey="pnl"
        />
      ) : (
        <AccountChart
          chartToShow="cumulative-interest-value"
          data={performanceData.map((d) => ({
            interest_value:
              d.borrow_interest_cumulative_usd +
              d.deposit_interest_cumulative_usd,
            time: d.time,
          }))}
          hideChart={handleHideChart}
          mangoAccount={mangoAccount!}
          yKey="interest_value"
        />
      )}
    </div>
  )
}

export default AccountPage
