import { useEffect, useState } from 'react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import SecondaryTabBar from '@components/shared/SecondaryTabBar'
import TokenMarketInfoTable from './TokenMarketInfoTable'
import TokenSettingsTable from './TokenSettingsTable'
import { TABS } from './PerpStats'

const TokenStats = () => {
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
      return <TokenMarketInfoTable />
    case TABS[1]:
      return <TokenSettingsTable />
    default:
      return <TokenMarketInfoTable />
  }
}

export default TokenStats
