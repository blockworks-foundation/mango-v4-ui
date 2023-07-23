import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import useMangoAccount from './useMangoAccount'
import useMangoGroup from './useMangoGroup'

export function useUnsettledSpotBalances() {
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const openOrdersAccounts =
    mangoStore.getState().mangoAccount.openOrderAccounts

  const unsettledSpotBalances = useMemo(() => {
    if (!group || !mangoAccount || !openOrdersAccounts) return {}
    const unsettledBalances: Record<string, { base: number; quote: number }> =
      {}
    mangoAccount.serum3Active().forEach((serumMarket) => {
      const market = group.getSerum3MarketByMarketIndex(serumMarket.marketIndex)
      const openOrdersAccForMkt = openOrdersAccounts.find((oo) =>
        oo.market.equals(market.serumMarketExternal),
      )
      if (openOrdersAccForMkt) {
        const baseTokenUnsettled = toUiDecimals(
          openOrdersAccForMkt.baseTokenFree.toNumber(),
          group.getFirstBankByTokenIndex(serumMarket.baseTokenIndex)
            .mintDecimals,
        )
        const quoteTokenUnsettled = toUiDecimals(
          openOrdersAccForMkt.quoteTokenFree
            // @ts-ignore
            .add(openOrdersAccForMkt['referrerRebatesAccrued'])
            .toNumber(),
          group.getFirstBankByTokenIndex(serumMarket.quoteTokenIndex)
            .mintDecimals,
        )
        unsettledBalances[market.serumMarketExternal.toString()] = {
          base: baseTokenUnsettled,
          quote: quoteTokenUnsettled,
        }
      }
    })

    const filtered = Object.entries(unsettledBalances).filter(
      ([_mkt, balance]) => balance.base > 0 || balance.quote > 0,
    )
    return Object.fromEntries(filtered)
  }, [mangoAccount, group, openOrdersAccounts])

  return unsettledSpotBalances
}
