import {
  HealthType,
  I80F48,
  toUiDecimalsForQuote,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useEffect, useMemo, useState } from 'react'
import AccountActions from './AccountActions'
import DepositModal from '../modals/DepositModal'
import WithdrawModal from '../modals/WithdrawModal'
import mangoStore, { PerformanceDataItem } from '@store/mangoStore'
import { formatDecimal, formatFixedDecimals } from '../../utils/numbers'
import FlipNumbers from 'react-flip-numbers'
import { DownTriangle, UpTriangle } from '../shared/DirectionTriangles'
import SimpleAreaChart from '../shared/SimpleAreaChart'
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
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../../utils/theme'
import useMangoAccount from '../shared/useMangoAccount'
import PercentageChange from '../shared/PercentageChange'

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
  const { mangoAccount, lastUpdatedAt } = useMangoAccount()
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
    if (performanceData.length && mangoAccount) {
      return {
        accountPnl: performanceData[performanceData.length - 1].pnl,
        accountValueChange:
          ((toUiDecimalsForQuote(mangoAccount.getEquity()!.toNumber()) -
            performanceData[0].account_equity) /
            performanceData[0].account_equity) *
          100,
      }
    }
    return { accountPnl: 0, accountValueChange: 0 }
  }, [performanceData, mangoAccount])

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
            <div className="mb-1 flex items-center text-5xl font-bold text-th-fgd-1">
              $
              {mangoAccount ? (
                <FlipNumbers
                  height={48}
                  width={32}
                  play
                  delay={0.05}
                  duration={1}
                  numbers={formatDecimal(
                    toUiDecimalsForQuote(mangoAccount.getEquity()!.toNumber()),
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
            <PercentageChange change={accountValueChange} />
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
        <AccountActions />
      </div>
      <div className="grid grid-cols-3 gap-x-6 border-b border-th-bkg-3 md:border-b-0">
        <div className="col-span-3 border-t border-th-bkg-3 py-4 md:col-span-1 md:border-l md:border-t-0 md:pl-6 lg:col-span-1">
          <p className="text-th-fgd-3">{t('health')}</p>
          <p className="text-2xl font-bold text-th-fgd-1">{maintHealth}%</p>
        </div>
        <div className="col-span-3 border-t border-th-bkg-3 py-4 md:col-span-1 md:border-l md:border-t-0 md:pl-6 lg:col-span-1">
          <p className="text-th-fgd-3">{t('free-collateral')}</p>
          <p className="text-2xl font-bold text-th-fgd-1">
            {mangoAccount
              ? formatFixedDecimals(
                  toUiDecimalsForQuote(
                    mangoAccount.getCollateralValue()!.toNumber()
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
        <div className="col-span-3 flex items-center justify-between border-t border-th-bkg-3 py-4 md:col-span-1 md:border-l md:border-t-0 md:pl-6 lg:col-span-1">
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

export default AccountPage
