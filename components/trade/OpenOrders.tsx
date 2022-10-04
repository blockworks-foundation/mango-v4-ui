import { Serum3Side } from '@blockworks-foundation/mango-v4'
import { IconButton } from '@components/shared/Button'
import Loading from '@components/shared/Loading'
import SideBadge from '@components/shared/SideBadge'
import Tooltip from '@components/shared/Tooltip'
import { LinkIcon, TrashIcon } from '@heroicons/react/20/solid'
import { Order } from '@project-serum/serum/lib/market'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import { useCallback, useState } from 'react'
import { notify } from 'utils/notifications'
import { formatFixedDecimals, getDecimalCount } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import MarketLogos from './MarketLogos'

const OpenOrders = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { connected } = useWallet()
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const [cancelId, setCancelId] = useState<string>('')
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const handleCancelOrder = useCallback(
    async (o: Order) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const selectedMarket = mangoStore.getState().selectedMarket.current
      const actions = mangoStore.getState().actions

      if (!group || !mangoAccount) return
      setCancelId(o.orderId.toString())
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
          title: t('trade:cancel-order-error'),
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      } finally {
        setCancelId('')
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
            <th className="text-right">{t('trade:side')}</th>
            <th className="text-right">{t('trade:size')}</th>
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
                    <td className="text-right font-mono">
                        {o.size.toLocaleString(undefined, {
                          maximumFractionDigits: getDecimalCount(o.size),
                        })}
                      </td>
                      <td className="text-right">
                        <span className="font-mono">
                          {o.price.toLocaleString(undefined, {
                            maximumFractionDigits: getDecimalCount(o.price),
                          })}{' '}
                          <span className="font-body tracking-wide text-th-fgd-4">
                            {quoteSymbol}
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
                            disabled={cancelId === o.orderId.toString()}
                            onClick={() => handleCancelOrder(o)}
                            size="small"
                          >
                            {cancelId === o.orderId.toString() ? (
                              <Loading className="h-4 w-4" />
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                )
              })
              .flat()}
          </tbody>
        </table>
      ) : (
        <div className="pb-20">
          {Object.entries(openOrders).map(([marketPk, orders]) => {
            return orders.map((o) => {
              const group = mangoStore.getState().group
              const market = group?.getSerum3MarketByPk(new PublicKey(marketPk))
              let baseLogoURI = ''
              let quoteLogoURI = ''
              const baseSymbol = group?.getFirstBankByTokenIndex(
                market!.baseTokenIndex
              ).name
              const quoteSymbol = group?.getFirstBankByTokenIndex(
                market!.quoteTokenIndex
              ).name
              if (jupiterTokens.length) {
                baseLogoURI = jupiterTokens.find(
                  (t) => t.symbol === baseSymbol
                )!.logoURI
                quoteLogoURI = jupiterTokens.find(
                  (t) => t.symbol === quoteSymbol
                )!.logoURI
              }
              return (
                <div
                  className="flex items-center justify-between border-b border-th-bkg-3 p-4"
                  key={`${o.side}${o.size}${o.price}`}
                >
                  <div className="flex items-center">
                    <MarketLogos
                      baseURI={baseLogoURI}
                      quoteURI={quoteLogoURI}
                    />
                    <div>
                      <p className="text-sm text-th-fgd-1">{market?.name}</p>
                      <span
                        className={`capitalize ${
                          o.side === 'buy' ? 'text-th-green' : 'text-th-red'
                        }`}
                      >
                        {o.side}
                      </span>{' '}
                      <span className="font-mono">
                        {o.size.toLocaleString(undefined, {
                          maximumFractionDigits: getDecimalCount(o.size),
                        })}
                      </span>{' '}
                      <span className="text-th-fgd-4">at</span>{' '}
                      <span className="font-mono">
                        {o.price.toLocaleString(undefined, {
                          maximumFractionDigits: getDecimalCount(o.price),
                        })}
                      </span>{' '}
                      <span className="text-th-fgd-4">{quoteSymbol}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 pl-4">
                    <span>{formatFixedDecimals(o.size * o.price, true)}</span>
                    <IconButton
                      disabled={cancelId === o.orderId.toString()}
                      onClick={() => handleCancelOrder(o)}
                    >
                      {cancelId === o.orderId.toString() ? (
                        <Loading className="h-4 w-4" />
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </IconButton>
                  </div>
                </div>
              )
            })
          })}
        </div>
      )
    ) : (
      <div className="flex flex-col items-center p-8">
        <p>{t('trade:no-orders')}</p>
      </div>
    )
  ) : (
    <div className="flex flex-col items-center p-8">
      <LinkIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>{t('trade:connect-orders')}</p>
    </div>
  )
}

export default OpenOrders
