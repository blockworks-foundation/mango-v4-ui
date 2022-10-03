import { Serum3Side } from '@blockworks-foundation/mango-v4'
import { IconButton } from '@components/shared/Button'
import SideBadge from '@components/shared/SideBadge'
import Tooltip from '@components/shared/Tooltip'
import { LinkIcon, TrashIcon } from '@heroicons/react/20/solid'
import { Order } from '@project-serum/serum/lib/market'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { useCallback } from 'react'
import { notify } from 'utils/notifications'
import { formatFixedDecimals } from 'utils/numbers'
import MarketLogos from './MarketLogos'

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
          <tr>
            <th className="text-left">{t('market')}</th>
            <th className="text-right">{t('side')}</th>
            <th className="text-right">{t('size')}</th>
            <th className="text-right">{t('price')}</th>
            <th className="text-right">{t('value')}</th>
            <th className="text-right"></th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(openOrders)
            .map(([marketPk, orders]) => {
              return orders.map((o) => {
                const group = mangoStore.getState().group
                const serumMarket = group?.getSerum3MarketByPk(
                  new PublicKey(marketPk)
                )
                const quoteTokenBank = group?.getFirstBankByTokenIndex(
                  serumMarket!.quoteTokenIndex
                )
                return (
                  <tr key={`${o.side}${o.size}${o.price}`} className="my-1 p-2">
                    <td>
                      <div className="flex items-center">
                        <MarketLogos serumMarket={serumMarket!} />
                        {serumMarket?.name}
                      </div>
                    </td>
                    <td className="text-right">
                      <SideBadge side={o.side} />
                    </td>
                    <td className="text-right">{o.size}</td>
                    <td className="text-right">
                      <span>
                        {o.price}{' '}
                        <span className="text-th-fgd-4">
                          {quoteTokenBank?.name}
                        </span>
                      </span>
                    </td>
                    <td className="text-right">
                      {formatFixedDecimals(o.size * o.price, true)}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <Tooltip content={t('cancel')}>
                          <IconButton
                            onClick={() => handleCancelOrder(o)}
                            size="small"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      </div>
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

export default OpenOrders
