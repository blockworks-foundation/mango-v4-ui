import { Serum3Side } from '@blockworks-foundation/mango-v4'
import Button from '@components/shared/Button'
import SideBadge from '@components/shared/SideBadge'
import TabButtons from '@components/shared/TabButtons'
import { LinkIcon, QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import { Order } from '@project-serum/serum/lib/market'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useCallback, useMemo, useState } from 'react'
import { notify } from 'utils/notifications'
import { formatDecimal } from 'utils/numbers'

const TABS = ['Balances', 'Orders']

const BalanceAndOpenOrders = () => {
  const [selectedTab, setSelectedTab] = useState('Balances')

  return (
    <div className="hide-scroll h-full overflow-y-scroll">
      <div className="sticky top-0 z-10">
        <TabButtons
          activeValue={selectedTab}
          onChange={(tab: string) => setSelectedTab(tab)}
          values={TABS}
          showBorders
        />
      </div>
      {selectedTab === 'Balances' ? <Balances /> : null}
      {selectedTab === 'Orders' ? <OpenOrders /> : null}
    </div>
  )
}

const Balances = () => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const group = mangoStore((s) => s.group)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)

  const banks = useMemo(() => {
    if (group) {
      const rawBanks = Array.from(group?.banksMapByName, ([key, value]) => ({
        key,
        value,
      }))
      const sortedBanks = mangoAccount
        ? rawBanks.sort(
            (a, b) =>
              Math.abs(
                mangoAccount?.getTokenBalanceUi(b.value[0]) *
                  b.value[0].uiPrice!
              ) -
              Math.abs(
                mangoAccount?.getTokenBalanceUi(a.value[0]) *
                  a.value[0].uiPrice!
              )
          )
        : rawBanks

      return mangoAccount
        ? sortedBanks.filter(
            (b) => mangoAccount?.getTokenBalanceUi(b.value[0]) !== 0
          )
        : sortedBanks
    }
    return []
  }, [group, mangoAccount])

  return (
    <table className="min-w-full">
      <thead>
        <tr>
          <th className="bg-th-bkg-1 text-left">{t('token')}</th>
          <th className="bg-th-bkg-1 text-right">{t('balance')}</th>
          <th className="bg-th-bkg-1 text-right">In Orders</th>
          <th className="bg-th-bkg-1 text-right">Unsettled</th>
        </tr>
      </thead>
      <tbody>
        {banks.map(({ key, value }) => {
          const bank = value[0]
          const oraclePrice = bank.uiPrice

          let logoURI
          if (jupiterTokens.length) {
            logoURI = jupiterTokens.find(
              (t) => t.address === bank.mint.toString()
            )!.logoURI
          }

          return (
            <tr key={key} className="text-sm">
              <td>
                <div className="flex items-center">
                  <div className="mr-2.5 flex flex-shrink-0 items-center">
                    {logoURI ? (
                      <Image alt="" width="20" height="20" src={logoURI} />
                    ) : (
                      <QuestionMarkCircleIcon className="h-7 w-7 text-th-fgd-3" />
                    )}
                  </div>
                  <span>{bank.name}</span>
                </div>
              </td>
              <td className="pt-4 text-right font-mono">
                <div>
                  {mangoAccount
                    ? formatDecimal(
                        mangoAccount.getTokenBalanceUi(bank),
                        bank.mintDecimals
                      )
                    : 0}
                </div>
              </td>
              <td className="text-right font-mono">
                {spotBalances[bank.mint.toString()]?.inOrders || 0.0}
              </td>
              <td className="text-right font-mono">
                {spotBalances[bank.mint.toString()]?.unsettled || 0.0}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const OpenOrders = () => {
  const { t } = useTranslation('common')
  const { connected } = useWallet()
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)

  const handleCancelOrder = useCallback(
    async (o: Order) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const selectedMarket = mangoStore.getState().selectedMarket.current
      const actions = mangoStore.getState().actions

      if (!group || !mangoAccount) return

      try {
        const tx = await client.serum3CancelOrder(
          group,
          mangoAccount,
          selectedMarket!.serumMarketExternal,
          o.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
          o.orderId
        )
        actions.fetchSerumOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx,
        })
      } catch (e: any) {
        console.error('Error canceling', e)
        notify({
          title: t('order-error'),
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    },
    [t]
  )

  return connected ? (
    Object.values(openOrders).flat().length ? (
      <table>
        <thead>
          <tr className="">
            <th className="text-left">Token</th>
            <th className="text-right">Side</th>
            <th className="text-right">Size</th>
            <th className="text-right">Price</th>
            <th className="text-right"></th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(openOrders)
            .map(([marketPk, orders]) => {
              return orders.map((o) => {
                const group = mangoStore.getState().group
                return (
                  <tr key={`${o.side}${o.size}${o.price}`} className="my-1 p-2">
                    <td className="">
                      {
                        group?.getSerum3MarketByPk(new PublicKey(marketPk))
                          ?.name
                      }
                    </td>
                    <td className="text-right">
                      <SideBadge side={o.side} />
                    </td>
                    <td className="text-right">{o.size}</td>
                    <td className="text-right">{o.price}</td>
                    <td className="text-right">
                      <Button size="small" onClick={() => handleCancelOrder(o)}>
                        Cancel
                      </Button>
                    </td>
                  </tr>
                )
              })
            })
            .flat()}
        </tbody>
      </table>
    ) : (
      <div className="flex flex-col items-center p-8">
        <p>No open orders...</p>
      </div>
    )
  ) : (
    <div className="flex flex-col items-center p-8">
      <LinkIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>Connect to view your open orders</p>
    </div>
  )
}

export default BalanceAndOpenOrders
