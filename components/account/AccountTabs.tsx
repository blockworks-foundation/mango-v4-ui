import { useMemo, useState } from 'react'
import TabButtons from '../shared/TabButtons'
import TokenList from '../TokenList'
import UnsettledTrades from '@components/trade/UnsettledTrades'
import { useUnsettledSpotBalances } from 'hooks/useUnsettledSpotBalances'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import useUnsettledPerpPositions from 'hooks/useUnsettledPerpPositions'
import mangoStore from '@store/mangoStore'
import PerpPositions from '@components/trade/PerpPositions'
import useOpenPerpPositions from 'hooks/useOpenPerpPositions'
import OpenOrders from '@components/trade/OpenOrders'
import HistoryTabs from './HistoryTabs'
import ManualRefresh from '@components/shared/ManualRefresh'

const AccountTabs = () => {
  const [activeTab, setActiveTab] = useState('balances')
  const { width } = useViewport()
  const unsettledSpotBalances = useUnsettledSpotBalances()
  const unsettledPerpPositions = useUnsettledPerpPositions()
  const openPerpPositions = useOpenPerpPositions()
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const isMobile = width ? width < breakpoints.lg : false

  const tabsWithCount: [string, number][] = useMemo(() => {
    const unsettledTradeCount =
      Object.values(unsettledSpotBalances).flat().length +
      unsettledPerpPositions?.length

    return [
      ['balances', 0],
      ['trade:positions', openPerpPositions.length],
      ['trade:orders', Object.values(openOrders).flat().length],
      ['trade:unsettled', unsettledTradeCount],
      ['history', 0],
    ]
  }, [
    openPerpPositions,
    unsettledPerpPositions,
    unsettledSpotBalances,
    openOrders,
  ])

  return (
    <>
      <div className="hide-scroll flex items-center overflow-x-auto border-b border-th-bkg-3">
        <TabButtons
          activeValue={activeTab}
          onChange={(v) => setActiveTab(v)}
          values={tabsWithCount}
          showBorders
          fillWidth={isMobile}
        />
        <ManualRefresh
          classNames="fixed bottom-16 right-4 lg:relative lg:bottom-0 md:bottom-6 md:right-6 z-10 shadow-lg lg:shadow-none bg-th-bkg-3 lg:bg-transparent"
          hideBg={isMobile}
          size={isMobile ? 'large' : 'small'}
        />
      </div>
      <TabContent activeTab={activeTab} />
    </>
  )
}

const TabContent = ({ activeTab }: { activeTab: string }) => {
  const unsettledSpotBalances = useUnsettledSpotBalances()
  const unsettledPerpPositions = useUnsettledPerpPositions()
  switch (activeTab) {
    case 'balances':
      return <TokenList />
    case 'trade:positions':
      return <PerpPositions />
    case 'trade:orders':
      return <OpenOrders />
    case 'trade:unsettled':
      return (
        <UnsettledTrades
          unsettledSpotBalances={unsettledSpotBalances}
          unsettledPerpPositions={unsettledPerpPositions}
        />
      )
    case 'history':
      return <HistoryTabs />
    default:
      return <TokenList />
  }
}

export default AccountTabs
