import { useMemo, useState } from 'react'
import TabButtons from '../shared/TabButtons'
import TokenList from '../TokenList'
import SwapHistoryTable from '../swap/SwapHistoryTable'
import ActivityFeed from './ActivityFeed'
import UnsettledTrades from '@components/trade/UnsettledTrades'
import { useUnsettledSpotBalances } from 'hooks/useUnsettledSpotBalances'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import useUnsettledPerpPositions from 'hooks/useUnsettledPerpPositions'
import TradeHistory from '@components/trade/TradeHistory'
import mangoStore from '@store/mangoStore'
import PerpPositions from '@components/trade/PerpPositions'

const AccountTabs = () => {
  const [activeTab, setActiveTab] = useState('balances')
  const { width } = useViewport()
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)
  const unsettledSpotBalances = useUnsettledSpotBalances()
  const unsettledPerpPositions = useUnsettledPerpPositions()
  const isMobile = width ? width < breakpoints.lg : false

  const tabsWithCount: [string, number][] = useMemo(() => {
    const unsettledTradeCount =
      Object.values(unsettledSpotBalances).flat().length +
      unsettledPerpPositions?.length
    const openPerpPositions = Object.values(perpPositions).filter((p) =>
      p.basePositionLots.toNumber()
    )

    return [
      ['balances', 0],
      ['trade:positions', openPerpPositions.length],
      ['trade:unsettled', unsettledTradeCount],
      ['activity:activity', 0],
      ['swap:swap-history', 0],
      ['trade-history', 0],
    ]
  }, [unsettledPerpPositions, unsettledSpotBalances])

  return (
    <>
      <div className="hide-scroll overflow-x-auto border-b border-th-bkg-3">
        <TabButtons
          activeValue={activeTab}
          onChange={(v) => setActiveTab(v)}
          values={tabsWithCount}
          showBorders
          fillWidth={isMobile}
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
    case 'trade:unsettled':
      return (
        <UnsettledTrades
          unsettledSpotBalances={unsettledSpotBalances}
          unsettledPerpPositions={unsettledPerpPositions}
        />
      )
    case 'activity:activity':
      return <ActivityFeed />
    case 'swap:swap-history':
      return <SwapHistoryTable />
    case 'trade-history':
      return <TradeHistory />
    default:
      return <TokenList />
  }
}

export default AccountTabs
