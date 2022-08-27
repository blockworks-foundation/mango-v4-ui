import {
  HealthType,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import type { NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useEffect, useMemo, useState } from 'react'
import AccountActions from '../components/account/AccountActions'
import DepositModal from '../components/modals/DepositModal'
import WithdrawModal from '../components/modals/WithdrawModal'
import mangoStore, { PerformanceDataItem } from '../store/mangoStore'
import { formatDecimal, formatFixedDecimals } from '../utils/numbers'
import FlipNumbers from 'react-flip-numbers'
import {
  DownTriangle,
  UpTriangle,
} from '../components/shared/DirectionTriangles'
import SimpleAreaChart from '../components/shared/SimpleAreaChart'
import { COLORS } from '../styles/colors'
import { useTheme } from 'next-themes'
import { IconButton } from '../components/shared/Button'
import { ArrowsExpandIcon, ChevronRightIcon } from '@heroicons/react/solid'
import { Transition } from '@headlessui/react'
import AccountTabs from '../components/account/AccountTabs'
import SheenLoader from '../components/shared/SheenLoader'
import AccountChart from '../components/account/AccountChart'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../utils/theme'
import useMangoAccount from '../components/shared/useMangoAccount'

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

const Index: NextPage = () => {
  const { t } = useTranslation('common')
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
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  useEffect(() => {
    if (mangoAccount) {
      const pubKey = mangoAccount.publicKey.toString()
      actions.fetchAccountPerformance(pubKey, 1)
      actions.fetchAccountInterestTotals(pubKey)
    }
  }, [actions, mangoAccount])

  useEffect(() => {
    if (!oneDayPerformanceData.length && performanceData.length) {
      setOneDayPerformanceData(performanceData)
    }
  }, [oneDayPerformanceData, performanceData])

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

  const { accountPnl, accountValueChange } = useMemo(() => {
    if (performanceData.length) {
      return {
        accountPnl: performanceData[performanceData.length - 1].pnl,
        accountValueChange:
          ((performanceData[performanceData.length - 1].account_equity -
            performanceData[0].account_equity) /
            performanceData[0].account_equity) *
          100,
      }
    }
    return { accountPnl: 0, accountValueChange: 0 }
  }, [performanceData])

  const interestTotalValue = useMemo(() => {
    if (totalInterestData.length) {
      return totalInterestData.reduce(
        (a, c) => a + c.borrow_interest_usd + c.deposit_interest_usd,
        0
      )
    }
    return 0
  }, [totalInterestData])

  const maintHealth = useMemo(() => {
    return mangoAccount ? mangoAccount.getHealthRatioUi(HealthType.maint) : 100
  }, [mangoAccount])

  return !chartToShow ? (
    <>
      <div className="mb-8 flex flex-col md:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="mb-4 flex items-center space-x-6 lg:mb-0">
          <div>
            <p className="mb-1.5">{t('account-value')}</p>
            <div className="flex items-center text-5xl font-bold text-th-fgd-1">
              $
              {mangoAccount ? (
                <FlipNumbers
                  height={48}
                  width={32}
                  play
                  delay={0.05}
                  duration={1}
                  numbers={formatDecimal(
                    toUiDecimalsForQuote(mangoAccount.getEquity().toNumber()),
                    2
                  )}
                />
              ) : (
                <FlipNumbers
                  height={48}
                  width={32}
                  play
                  delay={0.05}
                  duration={1}
                  numbers={'0.00'}
                />
              )}
            </div>
            {performanceData.length && mangoAccount ? (
              <div className="mt-1 flex items-center space-x-2">
                {accountValueChange > 0 ? (
                  <UpTriangle />
                ) : accountValueChange < 0 ? (
                  <DownTriangle />
                ) : (
                  ''
                )}
                <p
                  className={
                    accountValueChange > 0
                      ? 'text-th-green'
                      : accountValueChange < 0
                      ? 'text-th-red'
                      : 'text-th-fgd-4'
                  }
                >
                  {isNaN(accountValueChange)
                    ? '0.00'
                    : accountValueChange.toFixed(2)}
                  %
                </p>
              </div>
            ) : (
              <div className="mt-1 flex items-center space-x-2">
                <UpTriangle />
                <p className="text-th-green">0.00%</p>
              </div>
            )}
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
                  data={performanceData}
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
                    <ArrowsExpandIcon className="h-5 w-5" />
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
        <AccountActions />
      </div>
      <div className="grid grid-cols-4 gap-x-6 border-b border-th-bkg-3 md:border-b-0">
        <div className="col-span-4 border-t border-th-bkg-3 py-4 md:col-span-2 md:border-l md:border-t-0 md:pl-6 lg:col-span-1">
          <p className="text-th-fgd-3">{t('health')}</p>
          <p className="text-2xl font-bold text-th-fgd-1">{maintHealth}%</p>
        </div>
        <div className="col-span-4 border-t border-th-bkg-3 py-4 md:col-span-2 md:border-l md:border-t-0 md:pl-6 lg:col-span-1">
          <p className="text-th-fgd-3">{t('free-collateral')}</p>
          <p className="text-2xl font-bold text-th-fgd-1">
            {mangoAccount
              ? formatFixedDecimals(
                  toUiDecimalsForQuote(
                    mangoAccount.getCollateralValue().toNumber()
                  ),
                  true
                )
              : (0).toFixed(2)}
          </p>
        </div>
        {/* <div className="col-span-4 flex items-center justify-between border-t border-th-bkg-3 py-4 md:col-span-2 md:border-l md:border-t-0 md:pl-6 lg:col-span-1">
          <div>
            <p className="text-th-fgd-3">{t('pnl')}</p>
            <p className="text-2xl font-bold text-th-fgd-1">
              {formatFixedDecimals(accountPnl, true)}
            </p>
          </div>
          {performanceData.length > 4 ? (
            <IconButton
              onClick={() => setChartToShow('pnl')}
              size={!isMobile ? 'small' : 'medium'}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </IconButton>
          ) : null}
        </div> */}
        <div className="col-span-4 flex items-center justify-between border-t border-th-bkg-3 py-4 md:col-span-2 md:border-l md:border-t-0 md:pl-6 lg:col-span-1">
          <div>
            <p className="text-th-fgd-3">{t('total-interest-value')}</p>
            <p className="text-2xl font-bold text-th-fgd-1">
              {formatFixedDecimals(interestTotalValue, true)}
            </p>
          </div>
          {interestTotalValue > 1 || interestTotalValue < -1 ? (
            <IconButton
              onClick={() => setChartToShow('cumulative-interest-value')}
              size={!isMobile ? 'small' : 'medium'}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </IconButton>
          ) : null}
        </div>
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
    </>
  ) : chartToShow === 'account-value' ? (
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
          d.borrow_interest_cumulative_usd + d.deposit_interest_cumulative_usd,
        time: d.time,
      }))}
      hideChart={handleHideChart}
      mangoAccount={mangoAccount!}
      yKey="interest_value"
    />
  )
}

export default Index
