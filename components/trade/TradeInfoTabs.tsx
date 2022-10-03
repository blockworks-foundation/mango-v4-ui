import { useMemo, useState } from 'react'
import TabButtons from '@components/shared/TabButtons'
import OpenOrders from './OpenOrders'
import Balances from './TradeBalances'
import UnsettledTrades from './UnsettledTrades'
import mangoStore from '@store/mangoStore'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'

const TradeInfoTabs = () => {
  const [selectedTab, setSelectedTab] = useState('balances')
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const openOrdersAccounts =
    mangoStore.getState().mangoAccount.openOrderAccounts
  const group = mangoStore((s) => s.group)

  const unsettledSpotBalances = useMemo(() => {
    if (!group || !mangoAccount || !openOrdersAccounts) return {}
    const unsettledBalances: Record<string, { base: number; quote: number }> =
      {}
    mangoAccount.serum3Active().forEach((serumMarket) => {
      const market = group.getSerum3MarketByIndex(serumMarket.marketIndex)!
      const openOrdersAccForMkt = openOrdersAccounts.find((oo) =>
        oo.market.equals(market.serumMarketExternal)
      )
      if (openOrdersAccForMkt) {
        const baseTokenUnsettled = toUiDecimals(
          openOrdersAccForMkt!.baseTokenFree.toNumber(),
          group.getFirstBankByTokenIndex(serumMarket.baseTokenIndex)
            .mintDecimals
        )
        const quoteTokenUnsettled = toUiDecimals(
          openOrdersAccForMkt!.quoteTokenFree
            // @ts-ignore
            .add(openOrdersAccForMkt['referrerRebatesAccrued'])
            .toNumber(),
          group.getFirstBankByTokenIndex(serumMarket.quoteTokenIndex)
            .mintDecimals
        )
        unsettledBalances[market.serumMarketExternal.toString()] = {
          base: baseTokenUnsettled,
          quote: quoteTokenUnsettled,
        }
      }
    })

    const filtered = Object.entries(unsettledBalances).filter(
      ([_mkt, balance]) => balance.base > 0 || balance.quote > 0
    )
    return Object.fromEntries(filtered)!
  }, [mangoAccount, group, openOrdersAccounts])

  const tabsWithCount: [string, number][] = useMemo(() => {
    return [
      ['balances', 0],
      ['trade:orders', Object.values(openOrders).flat().length],
      ['trade:unsettled', Object.values(unsettledSpotBalances).flat().length],
    ]
  }, [openOrders, mangoAccount])

  return (
    <div className="hide-scroll h-full overflow-y-scroll">
      <div className="sticky top-0 z-10">
        <TabButtons
          activeValue={selectedTab}
          onChange={(tab: string) => setSelectedTab(tab)}
          values={tabsWithCount}
          showBorders
        />
      </div>
      {selectedTab === 'balances' ? <Balances /> : null}
      {selectedTab === 'trade:orders' ? <OpenOrders /> : null}
      {selectedTab === 'trade:unsettled' ? (
        <UnsettledTrades unsettledSpotBalances={unsettledSpotBalances} />
      ) : null}
    </div>
  )
}

export default TradeInfoTabs
