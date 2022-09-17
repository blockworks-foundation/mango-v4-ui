import { Serum3Side } from '@blockworks-foundation/mango-v4'
import Button from '@components/shared/Button'
import SideBadge from '@components/shared/SideBadge'
import TabButtons from '@components/shared/TabButtons'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import { Order } from '@project-serum/serum/lib/market'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { notify } from 'utils/notifications'
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'

const TABS = ['Balances', 'Open Orders']

const BalanceAndOpenOrders = () => {
  const [selectedTab, setSelectedTab] = useState('Balances')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)

  useEffect(() => {
    const actions = mangoStore.getState().actions

    if (mangoAccount && selectedMarket) {
      actions.fetchOpenOrdersForMarket(selectedMarket)
    }
  }, [mangoAccount, selectedMarket])

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
      {selectedTab === 'Open Orders' ? <OpenOrders /> : null}
    </div>
  )
}

const Balances = () => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
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
              <td className="text-right font-mono">0.00</td>
              <td className="text-right font-mono">0.00</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const OpenOrders = () => {
  const { t } = useTranslation('common')
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)

  const handleCancelOrder = useCallback(
    async (o: Order) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const selectedMarket = mangoStore.getState().selectedMarket.current

      if (!group || !mangoAccount) return

      try {
        const tx = await client.serum3CancelOrder(
          group,
          mangoAccount,
          selectedMarket!.serumMarketExternal,
          o.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
          o.orderId
        )
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

  return (
    <table>
      <thead>
        <tr className="">
          <th className="text-right">Side</th>
          <th className="text-right">Size</th>
          <th className="text-right">Price</th>
          <th className="text-right"></th>
        </tr>
      </thead>
      <tbody>
        {openOrders.map((o) => {
          return (
            <tr key={`${o.side}${o.size}${o.price}`} className="my-1 p-2">
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
        })}
      </tbody>
    </table>
  )
}

export default BalanceAndOpenOrders
