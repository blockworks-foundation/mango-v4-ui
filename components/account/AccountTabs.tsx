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
