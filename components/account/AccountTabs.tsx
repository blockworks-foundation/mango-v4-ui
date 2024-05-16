import { useEffect, useMemo, useState } from 'react'
import TabButtons from '../shared/TabButtons'
import TokenList from '../TokenList'
import UnsettledTrades from '@components/trade/UnsettledTrades'
import { useUnsettledSpotBalances } from 'hooks/useUnsettledSpotBalances'
import { useViewport } from 'hooks/useViewport'
import useUnsettledPerpPositions from 'hooks/useUnsettledPerpPositions'
import mangoStore, { AccountPageTab } from '@store/mangoStore'
import PerpPositions from '@components/trade/PerpPositions'
import useOpenPerpPositions from 'hooks/useOpenPerpPositions'
import HistoryTabs from './HistoryTabs'
import ManualRefresh from '@components/shared/ManualRefresh'
import useMangoAccount from 'hooks/useMangoAccount'
import AccountOverview from './AccountOverview'
import AccountOrders from './AccountOrders'
import { useRouter } from 'next/router'

const AccountTabs = ({ view }: { view: AccountPageTab }) => {
  const [activeTab, setActiveTab] = useState<AccountPageTab>(view)
  const set = mangoStore((s) => s.set)
  const { mangoAccount } = useMangoAccount()
  const { isMobile, isTablet } = useViewport()
  const router = useRouter()
  const { pathname, query } = router
  const unsettledSpotBalances = useUnsettledSpotBalances()
  const unsettledPerpPositions = useUnsettledPerpPositions()
  const { openPerpPositions } = useOpenPerpPositions()
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)

  useEffect(() => {
    setActiveTab(view)
  }, [view])

  const tabsWithCount: [AccountPageTab, number][] = useMemo(() => {
    const unsettledTradeCount =
      Object.values(unsettledSpotBalances).flat().length +
      unsettledPerpPositions?.length

    const stopOrdersCount =
      mangoAccount?.tokenConditionalSwaps.filter((tcs) => tcs.isConfigured)
        ?.length || 0

    const tabs: [AccountPageTab, number][] = [
      ['overview', 0],
      ['balances', 0],
      ['trade:positions', openPerpPositions.length],
      [
        'trade:orders',
        Object.values(openOrders).flat().length + stopOrdersCount,
      ],
      ['trade:unsettled', unsettledTradeCount],
      ['history', 0],
    ]
    return tabs
  }, [
    mangoAccount,
    openPerpPositions,
    unsettledPerpPositions,
    unsettledSpotBalances,
    openOrders,
  ])

  const handleTabChange = (tab: AccountPageTab) => {
    set((state) => {
      state.accountPageTab = tab
    })
    setActiveTab(tab)
    if (query?.view) {
      router.replace(pathname, undefined, { shallow: true })
    }
  }

  return (
    <>
      <div className="hide-scroll flex items-center justify-between overflow-x-auto border-b border-th-bkg-3">
        <div className="w-full md:w-auto" id="account-tabs">
          <TabButtons
            activeValue={activeTab}
            onChange={(v: AccountPageTab) => handleTabChange(v)}
            values={tabsWithCount}
            showBorders
            fillWidth={isMobile || isTablet}
          />
        </div>
        <ManualRefresh
          classNames="fixed bottom-16 right-4 md:relative md:pr-2 lg:pr-4 md:bottom-0 md:right-0 z-10 shadow-lg md:shadow-none bg-th-bkg-3 md:bg-transparent"
          hideBg={isMobile || isTablet}
          size={isTablet ? 'large' : 'small'}
        />
      </div>
      <div className="flex min-h-[calc(100vh-140px)] flex-col">
        <TabContent activeTab={activeTab} />
      </div>
    </>
  )
}

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'overview':
      return <AccountOverview />
    case 'balances':
      return <TokenList />
    case 'trade:positions':
      return <PerpPositions />
    case 'trade:orders':
      return <AccountOrders />
    case 'trade:unsettled':
      return <UnsettledTrades />
    case 'history':
      return <HistoryTabs />
    default:
      return <AccountOverview />
  }
}

export default AccountTabs
