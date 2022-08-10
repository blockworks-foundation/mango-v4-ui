import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import mangoStore from '../../store/state'
import TabButtons from '../shared/TabButtons'
import TokenList from '../TokenList'
import TradeHistoryTable from '../TradeHistoryTable'

export interface TradeHistoryItem {
  block_datetime: string
  mango_account: string
  signature: string
  swap_in_amount: number
  swap_in_loan: number
  swap_in_loan_origination_fee: number
  swap_in_price_usd: number
  swap_in_symbol: string
  swap_out_amount: number
  swap_out_loan: number
  swap_out_loan_origination_fee: number
  swap_out_price_usd: number
  swap_out_symbol: string
}

const AccountTabs = () => {
  const [activeTab, setActiveTab] = useState('tokens')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const [tradeHistory, setTradeHistory] = useState<Array<TradeHistoryItem>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mangoAccount) {
      const getTradeHistory = async () => {
        setLoading(true)
        try {
          const history = await fetch(
            `https://mango-transaction-log.herokuapp.com/v4/stats/swap-history?mango-account=${mangoAccount.publicKey.toString()}`
          )
          const parsedHistory = await history.json()
          const sortedHistory = parsedHistory.length
            ? parsedHistory.sort(
                (a: TradeHistoryItem, b: TradeHistoryItem) =>
                  dayjs(b.block_datetime).unix() -
                  dayjs(a.block_datetime).unix()
              )
            : []
          setTradeHistory(sortedHistory)
          setLoading(false)
        } catch (e) {
          console.log('error', e)
          setLoading(false)
        }
      }
      getTradeHistory()
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
