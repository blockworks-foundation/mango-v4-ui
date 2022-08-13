import { useEffect, useState } from 'react'
import mangoStore from '../../store/state'
import TabButtons from '../shared/TabButtons'
import TokenList from '../TokenList'
import TradeHistoryTable from '../TradeHistoryTable'

const AccountTabs = () => {
  const [activeTab, setActiveTab] = useState('tokens')
  const actions = mangoStore((s) => s.actions)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const tradeHistory = mangoStore((s) => s.mangoAccount.stats.tradeHistory.data)
  const loading = mangoStore((s) => s.mangoAccount.stats.tradeHistory.loading)

  useEffect(() => {
    if (mangoAccount) {
      actions.fetchTradeHistory(mangoAccount.publicKey.toString())
    }
  }, [mangoAccount])

  return (
    <>
      <div className="mb-4">
        <TabButtons
          activeValue={activeTab}
          onChange={(v) => setActiveTab(v)}
          values={['tokens', 'trade-history']}
          large
        />
      </div>
      {activeTab === 'tokens' ? (
        <TokenList />
      ) : (
        <TradeHistoryTable tradeHistory={tradeHistory} loading={loading} />
      )}
    </>
  )
}

export default AccountTabs
