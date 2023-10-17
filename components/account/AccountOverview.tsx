import { useMemo, useState } from 'react'
import AccountActions from './AccountActions'
import useMangoGroup from 'hooks/useMangoGroup'
import useMangoAccount from 'hooks/useMangoAccount'
import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import useAccountPerformanceData from 'hooks/useAccountPerformanceData'
import dayjs from 'dayjs'
import AccountHeroStats from './AccountHeroStats'
import { useTranslation } from 'react-i18next'
import Explore from '@components/explore/Explore'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { formatYAxis } from 'utils/formatting'
import { useWallet } from '@solana/wallet-adapter-react'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import CreateAccountModal from '@components/modals/CreateAccountModal'
import { FaceSmileIcon } from '@heroicons/react/20/solid'
import Button from '@components/shared/Button'

const EMPTY_STATE_WRAPPER_CLASSES =
  'flex h-[180px] flex-col justify-center pb-4 md:h-full'

const AccountOverview = () => {
  const { t } = useTranslation(['common', 'governance'])
  const { group } = useMangoGroup()
  const { mangoAccount, initialLoad } = useMangoAccount()
  const { connected } = useWallet()
  const { performanceData, rollingDailyData, loadingPerformanceData } =
    useAccountPerformanceData()
  const [daysToShow, setDaysToShow] = useState('1')
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)

  const accountValue = useMemo(() => {
    if (!group || !mangoAccount) return 0
    return toUiDecimalsForQuote(mangoAccount.getEquity(group).toNumber())
  }, [group, mangoAccount])

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
        pnl: latestDataItem.pnl,
        spot_value: latestDataItem.spot_value,
        transfer_balance: latestDataItem.transfer_balance,
      },
    ]
  }, [accountValue, performanceData])

  return (
    <>
      <div className="grid grid-cols-12 border-b border-th-bkg-3">
        <div className="col-span-12 border-b border-th-bkg-3 pt-4 md:col-span-8 md:border-b-0 md:border-r">
          <div className="flex h-full w-full flex-col justify-between">
            {mangoAccount || (connected && initialLoad) ? (
              <div className="px-4 pb-4 md:px-6">
                <DetailedAreaOrBarChart
                  data={rollingDailyData.concat(latestAccountData)}
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
            <div className="border-t border-th-bkg-3">
              <AccountActions />
            </div>
          </div>
        </div>
        <div className="col-span-12 md:col-span-4">
          <AccountHeroStats accountValue={accountValue} />
        </div>
      </div>
      <Explore />
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
