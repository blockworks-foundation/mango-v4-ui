import { useEffect, useState } from 'react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import SecondaryTabBar from '@components/shared/SecondaryTabBar'
import PerpMarketsTable from './PerpMarketsTable'
import PerpMarketSettingsTable from './PerpMarketSettingsTable'

const TABS = ['market-info', 'settings']

const PerpStats = () => {
  const [activeTab, setActiveTab] = useState('market-info')
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
    case 'market-info':
      return <PerpMarketsTable />
    case 'settings':
      return <PerpMarketSettingsTable />
    default:
      return <PerpMarketsTable />
  }
}

export default PerpStats
