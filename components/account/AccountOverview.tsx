import { useMemo, useState } from 'react'
import AccountActions from './AccountActions'
import useMangoGroup from 'hooks/useMangoGroup'
import useMangoAccount from 'hooks/useMangoAccount'
import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import useAccountPerformanceData from 'hooks/useAccountPerformanceData'
import dayjs from 'dayjs'
import AccountHeroStats from './AccountHeroStats'
import { useTranslation } from 'react-i18next'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { formatYAxis } from 'utils/formatting'
import { useWallet } from '@solana/wallet-adapter-react'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import CreateAccountModal from '@components/modals/CreateAccountModal'
import { FaceSmileIcon } from '@heroicons/react/20/solid'
import Button from '@components/shared/Button'
import Announcements from './Announcements'
import WatchlistTable, { WatchlistItem } from './WatchlistTable'
import mangoStore from '@store/mangoStore'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import useOpenPerpPositions from 'hooks/useOpenPerpPositions'
import useLocalStorageState from 'hooks/useLocalStorageState'
import TabsText from '@components/shared/TabsText'

const EMPTY_STATE_WRAPPER_CLASSES =
  'flex h-[180px] flex-col justify-center pb-4 md:h-full'

const DEFAULT_CHART_DATA = [
  {
    account_equity: 0,
    time: dayjs().subtract(1, 'hour').toISOString(),
    borrow_interest_cumulative_usd: 0,
    deposit_interest_cumulative_usd: 0,
    pnl: 0,
    spot_value: 0,
    transfer_balance: 0,
  },
]

const AccountOverview = () => {
  const { t } = useTranslation(['common', 'governance'])
  const { group } = useMangoGroup()
  const { mangoAccount, initialLoad } = useMangoAccount()
  const banks = useBanksWithBalances('balance')
  const { openPerpPositions } = useOpenPerpPositions()
  const { connected } = useWallet()
  const { performanceData, loadingPerformanceData } =
    useAccountPerformanceData()
  const [activeTab, setActiveTab] = useState('portfolio')
  const [daysToShow, setDaysToShow] = useState('1')
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const [watchlist] = useLocalStorageState('watchlist-0.1', [])

  const accountValue = useMemo(() => {
    if (!group || !mangoAccount) return 0
    return toUiDecimalsForQuote(mangoAccount.getEquity(group).toNumber())
  }, [group, mangoAccount])

  const latestAccountData = useMemo(() => {
    return [
      {
        account_equity: accountValue,
        time: dayjs().toISOString(),
        borrow_interest_cumulative_usd: 0,
        deposit_interest_cumulative_usd: 0,
        pnl: 0,
        spot_value: 0,
        transfer_balance: 0,
      },
    ]
  }, [accountValue])

  const chartData = useMemo(() => {
    if (performanceData && performanceData?.length) {
      return performanceData.concat(latestAccountData)
    }
    return DEFAULT_CHART_DATA.concat(latestAccountData)
  }, [latestAccountData, performanceData])

  const portfolio = useMemo(() => {
    const group = mangoStore.getState().group
    if ((!banks?.length && !openPerpPositions?.length) || !group) return []
    const list: WatchlistItem[] = []
    const balances = banks.filter((b) => Math.abs(b.balance) > 0)
    for (const balance of balances) {
      const item = {
        assetName: balance.bank.name,
        type: 'token',
        tokenOrMarketIndex: balance.bank.tokenIndex,
      }
      list.push(item)
    }
    for (const position of openPerpPositions) {
      const market = group.getPerpMarketByMarketIndex(position.marketIndex)
      const item = {
        assetName: market.name,
        type: 'perp',
        tokenOrMarketIndex: market.perpMarketIndex,
      }
      list.push(item)
    }
    return list
  }, [banks, openPerpPositions])

  const tabsWithCount: [string, number][] = useMemo(() => {
    const tabs: [string, number][] = [
      ['portfolio', portfolio.length],
      ['watchlist', watchlist.length],
    ]
    return tabs
  }, [portfolio, watchlist])

  return (
    <>
      <div className="grid grid-cols-12 border-b border-th-bkg-3">
        <div className="col-span-12 border-b border-th-bkg-3 md:col-span-8 md:border-b-0 md:border-r">
          <div
            className="flex h-full w-full flex-col justify-between"
            id="account-chart"
          >
            {mangoAccount || (connected && initialLoad) ? (
              <div className="overflow-x-hidden p-4 md:px-6">
                <DetailedAreaOrBarChart
                  changeAsPercent
                  data={chartData}
                  daysToShow={daysToShow}
                  setDaysToShow={setDaysToShow}
                  loading={loadingPerformanceData || initialLoad}
                  heightClass="h-[180px] lg:h-[205px]"
                  hideAxis
                  loaderHeightClass="h-[290px] lg:h-[315px]"
                  prefix="$"
                  tickFormat={(x) => `$${formatYAxis(x)}`}
                  title={t('account-value')}
                  xKey="time"
                  yKey="account_equity"
                  isPrivate
                />
              </div>
            ) : connected ? (
              <div className={EMPTY_STATE_WRAPPER_CLASSES}>
                <div className="flex flex-col items-center">
                  <FaceSmileIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
                  <p className="mb-4">Create a Mango Account to get started</p>
                  <Button onClick={() => setShowCreateAccountModal(true)}>
                    {t('create-account')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className={EMPTY_STATE_WRAPPER_CLASSES}>
                <ConnectEmptyState text={t('governance:connect-wallet')} />
              </div>
            )}
            <AccountActions />
          </div>
        </div>
        <div className="col-span-12 md:col-span-4">
          <AccountHeroStats accountValue={accountValue} />
        </div>
      </div>
      <Announcements />
      <TabsText
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={tabsWithCount}
        className="xl:text-lg"
      />
      {activeTab === 'portfolio' ? (
        <WatchlistTable assets={portfolio} isPortfolio />
      ) : null}
      {activeTab === 'watchlist' ? <WatchlistTable assets={watchlist} /> : null}
      {showCreateAccountModal ? (
        <CreateAccountModal
          isOpen={showCreateAccountModal}
          onClose={() => setShowCreateAccountModal(false)}
        />
      ) : null}
    </>
  )
}

export default AccountOverview
