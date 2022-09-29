import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo } from 'react'
import { PublicKey } from '@solana/web3.js'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import Button from '@components/shared/Button'
import { notify } from 'utils/notifications'

const UnsettledTrades = () => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const openOrdersAccounts =
    mangoStore.getState().mangoAccount.openOrderAccounts
  const group = mangoStore((s) => s.group)
  // const jupiterTokens = mangoStore((s) => s.jupiterTokens)

  const unsettledSpotBalances = useMemo(() => {
    if (!group || !mangoAccount) return {}
    const unsettledBalances: Record<string, { base: number; quote: number }> =
      {}
    mangoAccount.serum3Active().forEach((serumMarket) => {
      const market = group.getSerum3MarketByIndex(serumMarket.marketIndex)!
      const openOrdersAccForMkt = openOrdersAccounts.find((oo) =>
        oo.market.equals(market.serumMarketExternal)
      )
      const baseTokenUnsettled = toUiDecimals(
        openOrdersAccForMkt!.baseTokenFree.toNumber(),
        group.getFirstBankByTokenIndex(serumMarket.baseTokenIndex).mintDecimals
      )
      const quoteTokenUnsettled = toUiDecimals(
        openOrdersAccForMkt!.quoteTokenFree
          // @ts-ignore
          .add(openOrdersAccForMkt['referrerRebatesAccrued'])
          .toNumber(),
        group.getFirstBankByTokenIndex(serumMarket.quoteTokenIndex).mintDecimals
      )
      unsettledBalances[market.serumMarketExternal.toString()] = {
        base: baseTokenUnsettled,
        quote: quoteTokenUnsettled,
      }
    })

    const filtered = Object.entries(unsettledBalances).filter(
      ([_mkt, balance]) => balance.base > 0 || balance.quote > 0
    )
    return Object.fromEntries(filtered)!
  }, [mangoAccount, group, openOrdersAccounts])

  const handleSettleFunds = useCallback(async (mktAddress: string) => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions

    if (!group || !mangoAccount) return

    try {
      const txid = await client.serum3SettleFunds(
        group,
        mangoAccount,
        new PublicKey(mktAddress)
      )
      actions.fetchSerumOpenOrders()
      actions.reloadMangoAccount()
      notify({
        type: 'success',
        title: 'Successfully settled funds',
        txid,
      })
    } catch (e: any) {
      notify({
        type: 'error',
        title: 'Settle transaction failed',
        description: e?.message,
        txid: e?.txid,
      })
      console.error('Settle funds error:', e)
    }
  }, [])

  if (!group) return null

  // console.log('unsettledSpotBalances', unsettledSpotBalances)

  return (
    <table className="min-w-full">
      <thead>
        <tr>
          <th className="bg-th-bkg-1 text-left">Market</th>
          <th className="bg-th-bkg-1 text-right">Base</th>
          <th className="bg-th-bkg-1 text-right">Quote</th>
          <th className="bg-th-bkg-1 text-right"></th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(unsettledSpotBalances).map(([mktAddress, balance]) => {
          const market = group.getSerum3MarketByPk(new PublicKey(mktAddress))
          console.log('market', mktAddress)
          const base = market?.name.split('/')[0]
          const quote = market?.name.split('/')[1]

          return (
            <tr key={mktAddress} className="text-sm">
              <td>
                <div className="flex items-center">
                  <span>{market ? market.name : ''}</span>
                </div>
              </td>
              <td className="text-right font-mono">
                {unsettledSpotBalances[mktAddress].base || 0.0} {base}
              </td>
              <td className="text-right font-mono">
                {unsettledSpotBalances[mktAddress].quote || 0.0} {quote}
              </td>
              <td className="text-right">
                <Button
                  onClick={() => handleSettleFunds(mktAddress)}
                  className={`text-white`}
                  disabled={false}
                  size="small"
                >
                  <span>Settle</span>
                </Button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default UnsettledTrades
