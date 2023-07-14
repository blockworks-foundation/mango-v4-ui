import { useEffect, useState } from 'react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import SecondaryTabBar from '@components/shared/SecondaryTabBar'
import TokenOverviewTable from './TokenOverviewTable'
import TokenDetailsTable from './TokenDetailsTable'

const TABS = ['overview', 'details']

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
      return <TokenOverviewTable />
    case TABS[1]:
      return <TokenDetailsTable />
    default:
      return <TokenOverviewTable />
  }
}

export default TokenStats
