import { HealthType, toUiDecimals } from '@blockworks-foundation/mango-v4'
import type { NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useEffect, useMemo, useState } from 'react'
import AccountActions from '../components/account/AccountActions'
import DepositModal from '../components/modals/DepositModal'
import WithdrawModal from '../components/modals/WithdrawModal'
import mangoStore from '../store/state'
import { formatDecimal } from '../utils/numbers'
import FlipNumbers from 'react-flip-numbers'
import {
  DownTriangle,
  UpTriangle,
} from '../components/shared/DirectionTriangles'
import SimpleAreaChart from '../components/shared/SimpleAreaChart'
import { COLORS } from '../styles/colors'
import { useTheme } from 'next-themes'
import { IconButton } from '../components/shared/Button'
import { ArrowsExpandIcon } from '@heroicons/react/solid'
import { Transition } from '@headlessui/react'
import AccountTabs from '../components/account/AccountTabs'
import dayjs from 'dayjs'
import DetailedAccountValueChart from '../components/account/DetailedAccountValueChart'
import SheenLoader from '../components/shared/SheenLoader'
import { notify } from '../utils/notifications'

export interface PerformanceDataItem {
  account_equity: number
  pnl: number
  spot_value: number
  time: string
  transfer_balance: number
}

interface InterestItem {
  deposit_interest: number
  borrow_interest: number
  price: number
  time: string
}

interface HourlyInterestDataItem {
  symbol: string
  interest: Array<InterestItem>
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'close-account'])),
    },
  }
}

export const fetchHourlyPerformanceStats = async (
  mangoAccountPk: string,
  range: number
) => {
  const response = await fetch(
    `https://mango-transaction-log.herokuapp.com/v4/stats/performance_account?mango-account=${mangoAccountPk}&start-date=${dayjs()
      .subtract(range, 'day')
      .format('YYYY-MM-DD')}`
  )
  const parsedResponse = await response.json()
  const entries: any = Object.entries(parsedResponse).sort((a, b) =>
    b[0].localeCompare(a[0])
  )

  const stats = entries
    .map(([key, value]: Array<{ key: string; value: number }>) => {
      return { ...value, time: key }
    })
    .filter((x: string) => x)

  return stats
}

export const fetchHourlyInterest = async (
  mangoAccountPk: string,
  range: number
) => {
  const response = await fetch(
    `https://mango-transaction-log.herokuapp.com/v4/stats/interest-account-hourly?mango-account=${mangoAccountPk}&start-date=${dayjs()
      .subtract(range, 'day')
      .format('YYYY-MM-DD')}`
  )
  const parsedResponse = await response.json()
  const entries: any = Object.entries(parsedResponse).sort((a, b) =>
    b[0].localeCompare(a[0])
  )

  const totals = entries
    .map(
      ([key, value]: Array<{
        key: string
        value: any
      }>) => {
        const interest = Object.entries(value).map(([key, value]) => ({
          ...value,
          time: key,
        }))
        return { interest, symbol: key }
      }
    )
    .filter((x: string) => x)

  return totals
}

const Index: NextPage = () => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false)
  const [showDetailedValueChart, setShowDetailedValueChart] =
    useState<boolean>(false)
  const [showExpandChart, setShowExpandChart] = useState<boolean>(false)
  const [loadAccountData, setLoadAccountData] = useState<boolean>(false)
  const [performanceData, setPerformanceData] = useState<
    Array<PerformanceDataItem>
  >([])
  const [hourlyInterestData, setHourlyInterestData] = useState<
    Array<HourlyInterestDataItem>
  >([])
  const { theme } = useTheme()

  useEffect(() => {
    if (mangoAccount) {
      setLoadAccountData(true)
      const getData = async () => {
        const pubKey = mangoAccount.publicKey.toString()
        try {
          const promises = [
            fetchHourlyPerformanceStats(pubKey, 1),
            fetchHourlyInterest(pubKey, 1),
          ]
          const data = await Promise.all(promises)
          setPerformanceData(data[0])
          setHourlyInterestData(data[1])
          setLoadAccountData(false)
        } catch {
          notify({
            title: 'Failed to load account performance data',
            type: 'error',
          })
          setLoadAccountData(false)
        }
      }
      getData()
    }
  }, [mangoAccount])

  const onHoverMenu = (open: boolean, action: string) => {
    if (
      (!open && action === 'onMouseEnter') ||
      (open && action === 'onMouseLeave')
    ) {
      setShowExpandChart(!open)
    }
  }

  const handleShowDetailedValueChart = () => {
    setShowDetailedValueChart(true)
    setShowExpandChart(false)
  }

  const accountValueChange = useMemo(() => {
    if (performanceData.length) {
      return (
        ((performanceData[performanceData.length - 1].account_equity -
          performanceData[0].account_equity) /
          performanceData[0].account_equity) *
        100
      )
    }
    return 0
  }, [performanceData])

  const accountInterestTotalValue = useMemo(() => {
    if (hourlyInterestData.length) {
      const total = hourlyInterestData.reduce((a, c) => {
        const tokenInterestValue = c.interest.reduce(
          (a, c) => a + (c.borrow_interest + c.deposit_interest) * c.price,
          0
        )
        return a + tokenInterestValue
      }, 0)
      return total
    }
    return 0
  }, [hourlyInterestData])

  return !showDetailedValueChart ? (
    <>
      <div className="mb-8 flex flex-col md:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="mb-4 flex items-center space-x-6 lg:mb-0">
          <div>
            <p className="mb-1">{t('account-value')}</p>
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
                    toUiDecimals(mangoAccount.getEquity().toNumber()),
                    2
                  )}
                />
              ) : (
                (0).toFixed(2)
              )}
            </div>
            {performanceData.length ? (
              <div className="mt-1 flex items-center space-x-2">
                {accountValueChange > 0 ? (
                  <UpTriangle />
                ) : accountValueChange < 0 ? (
                  <DownTriangle />
                ) : (
                  ''
                )}

                <p
                  className={`mb-0.5 ${
                    accountValueChange > 0
                      ? 'text-th-green'
                      : accountValueChange < 0
                      ? 'text-th-red'
                      : 'text-th-fgd-4'
                  }`}
                >
                  {isNaN(accountValueChange)
                    ? '0.00'
                    : accountValueChange.toFixed(2)}
                  %
                </p>
              </div>
            ) : null}
          </div>
          {!loadAccountData ? (
            performanceData.length ? (
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
                  enter="transition-all ease-in duration-300"
                  enterFrom="opacity-0 transform scale-75"
                  enterTo="opacity-100 transform scale-100"
                  leave="transition ease-out duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <IconButton
                    className="text-th-fgd-3"
                    hideBg
                    onClick={() => handleShowDetailedValueChart()}
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
      <div className="mb-8 grid grid-cols-4 gap-x-6 border-b border-th-bkg-3 md:mb-10 md:border-b-0">
        <div className="col-span-3 border-t border-th-bkg-3 py-4 md:col-span-1 md:border-l md:border-t-0 md:pl-6">
          <p className="text-th-fgd-3">{t('health')}</p>
          <p className="text-2xl font-bold text-th-fgd-1">
            {mangoAccount
              ? mangoAccount.getHealthRatio(HealthType.init).toNumber()
              : 100}
            %
          </p>
        </div>
        <div className="col-span-3 border-t border-th-bkg-3 py-4 md:col-span-1 md:border-l md:border-t-0 md:pl-6">
          <p className="text-th-fgd-3">{t('free-collateral')}</p>
          <p className="text-2xl font-bold text-th-fgd-1">
            $
            {mangoAccount
              ? formatDecimal(
                  toUiDecimals(mangoAccount.getCollateralValue().toNumber()),
                  2
                )
              : (0).toFixed(2)}
          </p>
        </div>
        <div className="col-span-3 border-t border-th-bkg-3 py-4 md:col-span-1 md:border-l md:border-t-0 md:pl-6">
          <p className="text-th-fgd-3">{t('leverage')}</p>
          <p className="text-2xl font-bold text-th-fgd-1">0.0x</p>
        </div>
        <div className="col-span-3 border-t border-th-bkg-3 py-4 md:col-span-1 md:border-l md:border-t-0 md:pl-6">
          <p className="text-th-fgd-3">{t('total-interest-value')}</p>
          <p className="text-2xl font-bold text-th-fgd-1">
            ${accountInterestTotalValue.toFixed(2)}
          </p>
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
  ) : (
    <DetailedAccountValueChart
      data={performanceData}
      hideChart={() => setShowDetailedValueChart(false)}
      mangoAccount={mangoAccount!}
    />
  )
}

export default Index
