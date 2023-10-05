import { useEffect, useState } from 'react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import SecondaryTabBar from '@components/shared/SecondaryTabBar'
import PerpMarketsDetailsTable from './PerpMarketDetailsTable'
import PerpMarketsPositions from './PerpMarketsPositions'

const TABS = ['details', 'trade:positions']

const PerpStats = () => {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const actions = mangoStore((s) => s.actions)
  const { mangoAccountAddress } = useMangoAccount()

  useEffect(() => {
    if (actions && mangoAccountAddress) {
      actions.fetchActivityFeed(mangoAccountAddress)
    }
  }, [actions, mangoAccountAddress])

  return (
    <>
      <SecondaryTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={TABS}
      />
      <TabContent activeTab={activeTab} />
    </>
  )
}

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case TABS[0]:
      return <PerpMarketsDetailsTable />
    case TABS[1]:
      return <PerpMarketsPositions />
    default:
      return <PerpMarketsDetailsTable />
  }
}

export default PerpStats
