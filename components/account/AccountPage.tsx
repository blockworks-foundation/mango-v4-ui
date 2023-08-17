import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo, useState } from 'react'
import AccountActions from './AccountActions'
import AccountTabs from './AccountTabs'
import AccountChart from './AccountChart'
import useMangoAccount from '../../hooks/useMangoAccount'
import useLocalStorageState from 'hooks/useLocalStorageState'
import dayjs from 'dayjs'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import useMangoGroup from 'hooks/useMangoGroup'
import PnlHistoryModal from '@components/modals/PnlHistoryModal'
import AssetsLiabilities from './AssetsLiabilities'
import FundingChart from './FundingChart'
import VolumeChart from './VolumeChart'
import AccountHeroStats from './AccountHeroStats'
import AccountValue from './AccountValue'
import useAccountPerformanceData from 'hooks/useAccountPerformanceData'
import HealthContributions from './HealthContributions'
import { PerformanceDataItem } from 'types'
import { useRouter } from 'next/router'
import { useWallet } from '@solana/wallet-adapter-react'

const TABS = ['account-value', 'account:assets-liabilities']

export type ViewToShow =
  | ''
  | 'account-value'
  | 'cumulative-interest-value'
  | 'pnl'
  | 'hourly-funding'
  | 'hourly-volume'
  | 'health-contributions'

const AccountPage = () => {
  const { t } = useTranslation(['common', 'account'])
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const [showPnlHistory, setShowPnlHistory] = useState<boolean>(false)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  const [activeTab, setActiveTab] = useLocalStorageState(
    'accountHeroKey-0.1',
    'account-value',
  )
  const { performanceData, rollingDailyData } = useAccountPerformanceData()
  const router = useRouter()
  const { view } = router.query

  const handleViewChange = useCallback(
    (view: ViewToShow) => {
      const query = { ...router.query, ['view']: view }
      router.push({ pathname: router.pathname, query })
    },
    [router],
  )

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

  return !view ? (
    <>
      <div className="flex flex-col border-b-0 border-th-bkg-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:border-b">
        <div>
          <div className="hide-scroll flex justify-center space-x-2 md:justify-start">
            {TABS.map((tab) => (
              <button
                className={`rounded-md px-2.5 py-1.5 text-sm font-medium focus-visible:bg-th-bkg-3 focus-visible:text-th-fgd-1 ${
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
                rollingDailyData={rollingDailyData}
                handleViewChange={handleViewChange}
              />
            ) : null}
            {activeTab === 'account:assets-liabilities' ? (
              <AssetsLiabilities isMobile={isMobile} />
            ) : null}
          </div>
        </div>
        <div className="mb-1 mt-6 lg:mt-0">
          <AccountActions />
        </div>
      </div>
      <AccountHeroStats
        accountPnl={accountPnl}
        accountValue={accountValue}
        rollingDailyData={rollingDailyData}
        setShowPnlHistory={setShowPnlHistory}
        handleViewChange={handleViewChange}
      />
      <AccountTabs />
      {showPnlHistory ? (
        <PnlHistoryModal
          pnlChangeToday={pnlChangeToday}
          isOpen={showPnlHistory}
          onClose={handleCloseDailyPnlModal}
        />
      ) : null}
    </>
  ) : (
    <AccountView
      view={view as ViewToShow}
      latestAccountData={latestAccountData}
      handleViewChange={handleViewChange}
    />
  )
}

export default AccountPage

const AccountView = ({
  view,
  handleViewChange,
  latestAccountData,
}: {
  view: ViewToShow
  latestAccountData: PerformanceDataItem[]
  handleViewChange: (view: ViewToShow) => void
}) => {
  const router = useRouter()
  const { connected } = useWallet()
  const { address } = router.query
  const { performanceData } = useAccountPerformanceData()

  const handleHideChart = useCallback(() => {
    if (address && !connected) {
      router.push(`/?address=${address}`, undefined, { shallow: true })
    } else {
      router.push('/', undefined, { shallow: true })
    }
  }, [address, router, connected])

  switch (view) {
    case 'account-value':
      return (
        <AccountChart
          chartName="account-value"
          handleViewChange={handleViewChange}
          data={performanceData?.concat(latestAccountData)}
          hideChart={handleHideChart}
          yKey="account_equity"
        />
      )
    case 'pnl':
      return (
        <AccountChart
          chartName="pnl"
          handleViewChange={handleViewChange}
          data={performanceData?.concat(latestAccountData)}
          hideChart={handleHideChart}
          yKey="pnl"
        />
      )
    case 'cumulative-interest-value':
      return (
        <AccountChart
          chartName="cumulative-interest-value"
          handleViewChange={handleViewChange}
          data={performanceData?.concat(latestAccountData)}
          hideChart={handleHideChart}
          yKey="interest_value"
        />
      )
    case 'hourly-funding':
      return <FundingChart hideChart={handleHideChart} />
    case 'hourly-volume':
      return <VolumeChart hideChart={handleHideChart} />
    case 'health-contributions':
      return <HealthContributions hideView={handleHideChart} />
    default:
      return null
  }
}
