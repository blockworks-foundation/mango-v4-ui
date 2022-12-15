import {
  PerpMarket,
  PerpOrder,
  Serum3Market,
  Serum3Side,
} from '@blockworks-foundation/mango-v4'
import { IconButton } from '@components/shared/Button'
import Loading from '@components/shared/Loading'
import SideBadge from '@components/shared/SideBadge'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import Tooltip from '@components/shared/Tooltip'
import { LinkIcon, NoSymbolIcon, TrashIcon } from '@heroicons/react/20/solid'
import { Order } from '@project-serum/serum/lib/market'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import useCurrencyConversion from 'hooks/useCurrencyConversion'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import { useCallback, useState } from 'react'
import { notify } from 'utils/notifications'
import { formatFixedDecimals, getDecimalCount } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import TableMarketName from './TableMarketName'

const OpenOrders = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { connected } = useWallet()
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const [cancelId, setCancelId] = useState<string>('')
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const currencyConversionPrice = useCurrencyConversion()

  const handleCancelSerumOrder = useCallback(
    async (o: Order) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const selectedMarket = mangoStore.getState().selectedMarket.current
      const actions = mangoStore.getState().actions

      if (!group || !mangoAccount) return
      setCancelId(o.orderId.toString())
      try {
        if (selectedMarket instanceof Serum3Market) {
          const tx = await client.serum3CancelOrder(
            group,
            mangoAccount,
            selectedMarket!.serumMarketExternal,
            o.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
            o.orderId
          )
          actions.fetchOpenOrders()
          notify({
            type: 'success',
            title: 'Transaction successful',
            txid: tx,
          })
        }
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

  const handleCancelPerpOrder = useCallback(
    async (o: PerpOrder) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const selectedMarket = mangoStore.getState().selectedMarket.current
      const actions = mangoStore.getState().actions
      if (!group || !mangoAccount) return
      setCancelId(o.orderId.toString())
      try {
        if (selectedMarket instanceof PerpMarket) {
          const tx = await client.perpCancelOrder(
            group,
            mangoAccount,
            o.perpMarketIndex,
            o.orderId
          )
          actions.fetchOpenOrders()
          notify({
            type: 'success',
            title: 'Transaction successful',
            txid: tx,
          })
        }
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
      showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">{t('market')}</Th>
              <Th className="text-right">{t('trade:side')}</Th>
              <Th className="text-right">{t('trade:size')}</Th>
              <Th className="text-right">{t('price')}</Th>
              <Th className="text-right">{t('value')}</Th>
              <Th className="text-right"></Th>
            </TrHead>
          </thead>
          <tbody>
            {Object.entries(openOrders)
              .map(([marketPk, orders]) => {
                return orders.map((o) => {
                  const group = mangoStore.getState().group!
                  let market: PerpMarket | Serum3Market
                  let tickSize: number
                  let minOrderSize: number
                  let quoteSymbol
                  if (o instanceof PerpOrder) {
                    market = group.getPerpMarketByMarketIndex(o.perpMarketIndex)
                    quoteSymbol = group.getFirstBankByTokenIndex(
                      market.settleTokenIndex
                    ).name
                    tickSize = market.tickSize
                    minOrderSize = market.minOrderSize
                  } else {
                    market = group.getSerum3MarketByExternalMarket(
                      new PublicKey(marketPk)
                    )
                    quoteSymbol = group.getFirstBankByTokenIndex(
                      market!.quoteTokenIndex
                    ).name
                    const serumMarket = group.getSerum3ExternalMarket(
                      market.serumMarketExternal
                    )
                    tickSize = serumMarket.tickSize
                    minOrderSize = serumMarket.minOrderSize
                  }
                  return (
                    <TrBody
                      key={`${o.side}${o.size}${o.price}`}
                      className="my-1 p-2"
                    >
                      <Td>
                        <TableMarketName market={market} />
                      </Td>
                      <Td className="text-right">
                        <SideBadge side={o.side} />
                      </Td>
                      <Td className="text-right font-mono">
                        {o.size.toLocaleString(undefined, {
                          maximumFractionDigits: getDecimalCount(minOrderSize),
                        })}
                      </Td>
                      <Td className="text-right">
                        <span className="font-mono">
                          {o.price.toLocaleString(undefined, {
                            minimumFractionDigits: getDecimalCount(tickSize),
                            maximumFractionDigits: getDecimalCount(tickSize),
                          })}{' '}
                          <span className="font-body tracking-wide text-th-fgd-4">
                            {quoteSymbol}
                          </span>
                        </span>
                      </Td>
                      <Td className="text-right">
                        {formatFixedDecimals(
                          (o.size * o.price) / currencyConversionPrice,
                          true
                        )}
                      </Td>
                      <Td>
                        <div className="flex justify-end">
                          <Tooltip content={t('cancel')}>
                            <IconButton
                              disabled={cancelId === o.orderId.toString()}
                              onClick={() =>
                                o instanceof PerpOrder
                                  ? handleCancelPerpOrder(o)
                                  : handleCancelSerumOrder(o)
                              }
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
                      </Td>
                    </TrBody>
                  )
                })
              })
              .flat()}
          </tbody>
        </Table>
      ) : (
        <div>
          {Object.entries(openOrders).map(([marketPk, orders]) => {
            return orders.map((o) => {
              const group = mangoStore.getState().group!
              let market: PerpMarket | Serum3Market
              let tickSize: number
              let minOrderSize: number
              let quoteSymbol: string
              let baseSymbol: string
              if (o instanceof PerpOrder) {
                market = group.getPerpMarketByMarketIndex(o.perpMarketIndex)
                baseSymbol = market.name.split('-')[0]
                quoteSymbol = group.getFirstBankByTokenIndex(
                  market.settleTokenIndex
                ).name
                tickSize = market.tickSize
                minOrderSize = market.minOrderSize
              } else {
                market = group.getSerum3MarketByExternalMarket(
                  new PublicKey(marketPk)
                )
                baseSymbol = market.name.split('/')[0]
                quoteSymbol = group.getFirstBankByTokenIndex(
                  market!.quoteTokenIndex
                ).name
                const serumMarket = group.getSerum3ExternalMarket(
                  market.serumMarketExternal
                )
                tickSize = serumMarket.tickSize
                minOrderSize = serumMarket.minOrderSize
              }
              return (
                <div
                  className="flex items-center justify-between border-b border-th-bkg-3 p-4"
                  key={`${o.side}${o.size}${o.price}`}
                >
                  <div className="flex items-center space-x-2">
                    <TableMarketName market={market} />
                    <SideBadge side={o.side} />
                  </div>
                  <div className="flex items-center space-x-3 pl-8">
                    <div className="text-right">
                      <p className="mb-0.5 text-th-fgd-4">
                        <span className="font-mono text-th-fgd-3">
                          {o.size.toLocaleString(undefined, {
                            maximumFractionDigits:
                              getDecimalCount(minOrderSize),
                          })}
                        </span>{' '}
                        {baseSymbol}
                      </p>
                      <p className="text-xs text-th-fgd-4">
                        <span className="font-mono text-th-fgd-3">
                          {o.price.toLocaleString(undefined, {
                            minimumFractionDigits: getDecimalCount(tickSize),
                            maximumFractionDigits: getDecimalCount(tickSize),
                          })}
                        </span>{' '}
                        {quoteSymbol}
                      </p>
                    </div>
                    <IconButton
                      disabled={cancelId === o.orderId.toString()}
                      onClick={() =>
                        o instanceof PerpOrder
                          ? handleCancelPerpOrder(o)
                          : handleCancelSerumOrder(o)
                      }
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
        <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
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
