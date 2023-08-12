import { Bank, U64_MAX_BN } from '@blockworks-foundation/mango-v4'
import {
  PerpMarket,
  PerpOrder,
  PerpOrderType,
  Serum3Market,
  Serum3OrderType,
  Serum3SelfTradeBehavior,
  Serum3Side,
} from '@blockworks-foundation/mango-v4'
import Input from '@components/forms/Input'
import { IconButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import Loading from '@components/shared/Loading'
import SideBadge from '@components/shared/SideBadge'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import Tooltip from '@components/shared/Tooltip'
import {
  CheckIcon,
  NoSymbolIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import { Order } from '@project-serum/serum/lib/market'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import useUnownedAccount from 'hooks/useUnownedAccount'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { ChangeEvent, useCallback, useState } from 'react'
import { isMangoError } from 'types'
import { notify } from 'utils/notifications'
import { getDecimalCount } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import MarketLogos from './MarketLogos'
import PerpSideBadge from './PerpSideBadge'
import TableMarketName from './TableMarketName'

export const findSerum3MarketPkInOpenOrders = (
  o: Order,
): string | undefined => {
  const openOrders = mangoStore.getState().mangoAccount.openOrders
  let foundedMarketPk: string | undefined = undefined
  for (const [marketPk, orders] of Object.entries(openOrders)) {
    for (const order of orders) {
      if (order.orderId.eq(o.orderId)) {
        foundedMarketPk = marketPk
        break
      }
    }
    if (foundedMarketPk) {
      break
    }
  }
  return foundedMarketPk
}

const OpenOrders = () => {
  const { t } = useTranslation(['common', 'trade'])
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const [cancelId, setCancelId] = useState<string>('')
  const [modifyOrderId, setModifyOrderId] = useState<string | undefined>(
    undefined,
  )
  const [loadingModifyOrder, setLoadingModifyOrder] = useState(false)
  const [modifiedOrderSize, setModifiedOrderSize] = useState('')
  const [modifiedOrderPrice, setModifiedOrderPrice] = useState('')
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const { mangoAccountAddress } = useMangoAccount()
  const { connected } = useWallet()
  const { isUnownedAccount } = useUnownedAccount()
  const { selectedMarket } = useSelectedMarket()

  const handleCancelSerumOrder = useCallback(
    async (o: Order) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const actions = mangoStore.getState().actions
      if (!group || !mangoAccount) return
      const marketPk = findSerum3MarketPkInOpenOrders(o)
      if (!marketPk) return
      const market = group.getSerum3MarketByExternalMarket(
        new PublicKey(marketPk),
      )

      setCancelId(o.orderId.toString())
      try {
        const { signature: tx } = await client.serum3CancelOrder(
          group,
          mangoAccount,
          market!.serumMarketExternal,
          o.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
          o.orderId,
        )

        actions.fetchOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx,
        })
      } catch (e) {
        console.error('Error canceling', e)
        if (isMangoError(e)) {
          notify({
            title: t('trade:cancel-order-error'),
            description: e.message,
            txid: e.txid,
            type: 'error',
          })
        }
      } finally {
        setCancelId('')
      }
    },
    [t],
  )

  const modifyOrder = useCallback(
    async (o: PerpOrder | Order) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const actions = mangoStore.getState().actions
      const baseSize = modifiedOrderSize ? Number(modifiedOrderSize) : o.size
      const price = modifiedOrderPrice ? Number(modifiedOrderPrice) : o.price
      if (!group || !mangoAccount) return
      setLoadingModifyOrder(true)
      try {
        let tx
        if (o instanceof PerpOrder) {
          tx = await client.modifyPerpOrder(
            group,
            mangoAccount,
            o.perpMarketIndex,
            o.orderId,
            o.side,
            price,
            Math.abs(baseSize),
            undefined, // maxQuoteQuantity
            Date.now(),
            PerpOrderType.limit,
            undefined,
            undefined,
          )
        } else {
          const marketPk = findSerum3MarketPkInOpenOrders(o)
          if (!marketPk) return
          const market = group.getSerum3MarketByExternalMarket(
            new PublicKey(marketPk),
          )
          tx = await client.modifySerum3Order(
            group,
            o.orderId,
            mangoAccount,
            market.serumMarketExternal,
            o.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
            price,
            baseSize,
            Serum3SelfTradeBehavior.decrementTake,
            Serum3OrderType.limit,
            Date.now(),
            10,
          )
        }
        actions.fetchOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx.signature,
        })
      } catch (e) {
        console.error('Error canceling', e)
        if (isMangoError(e)) {
          notify({
            title: 'Unable to modify order',
            description: e.message,
            txid: e.txid,
            type: 'error',
          })
        }
      } finally {
        cancelEditOrderForm()
      }
    },
    [t, modifiedOrderSize, modifiedOrderPrice],
  )

  const handleCancelPerpOrder = useCallback(
    async (o: PerpOrder) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const actions = mangoStore.getState().actions
      if (!group || !mangoAccount) return
      setCancelId(o.orderId.toString())
      try {
        const { signature: tx } = await client.perpCancelOrder(
          group,
          mangoAccount,
          o.perpMarketIndex,
          o.orderId,
        )
        actions.fetchOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx,
        })
      } catch (e) {
        console.error('Error canceling', e)
        if (isMangoError(e)) {
          notify({
            title: t('trade:cancel-order-error'),
            description: e.message,
            txid: e.txid,
            type: 'error',
          })
        }
      } finally {
        setCancelId('')
      }
    },
    [t],
  )

  const showEditOrderForm = (order: Order | PerpOrder, tickSize: number) => {
    setModifyOrderId(order.orderId.toString())
    setModifiedOrderSize(order.size.toString())
    setModifiedOrderPrice(order.price.toFixed(getDecimalCount(tickSize)))
  }
  const cancelEditOrderForm = () => {
    setModifyOrderId(undefined)
    setLoadingModifyOrder(false)
    setModifiedOrderSize('')
    setModifiedOrderPrice('')
  }

  return mangoAccountAddress && Object.values(openOrders).flat().length ? (
    showTableView ? (
      <Table>
        <thead>
          <TrHead>
            <Th className="w-[16.67%] text-left">{t('market')}</Th>
            <Th className="w-[16.67%] text-right">{t('trade:size')}</Th>
            <Th className="w-[16.67%] text-right">{t('price')}</Th>
            <Th className="w-[16.67%] text-right">{t('value')}</Th>
            {!isUnownedAccount ? (
              <Th className="w-[16.67%] text-right" />
            ) : null}
          </TrHead>
        </thead>
        <tbody>
          {Object.entries(openOrders)
            .sort()
            .map(([marketPk, orders]) => {
              return orders.map((o) => {
                const group = mangoStore.getState().group!
                let market: PerpMarket | Serum3Market
                let tickSize: number
                let minOrderSize: number
                let expiryTimestamp: number | undefined
                let value: number
                if (o instanceof PerpOrder) {
                  market = group.getPerpMarketByMarketIndex(o.perpMarketIndex)
                  tickSize = market.tickSize
                  minOrderSize = market.minOrderSize
                  expiryTimestamp =
                    o.expiryTimestamp === U64_MAX_BN
                      ? 0
                      : o.expiryTimestamp.toNumber()
                  value = o.size * o.price
                } else {
                  market = group.getSerum3MarketByExternalMarket(
                    new PublicKey(marketPk),
                  )
                  const serumMarket = group.getSerum3ExternalMarket(
                    market.serumMarketExternal,
                  )
                  const quoteBank = group.getFirstBankByTokenIndex(
                    market.quoteTokenIndex,
                  )
                  tickSize = serumMarket.tickSize
                  minOrderSize = serumMarket.minOrderSize
                  value = o.size * o.price * quoteBank.uiPrice
                }
                const side =
                  o instanceof PerpOrder
                    ? 'bid' in o.side
                      ? 'long'
                      : 'short'
                    : o.side
                return (
                  <TrBody
                    key={`${o.side}${o.size}${o.price}${o.orderId.toString()}`}
                    className="my-1 p-2"
                  >
                    <Td className="w-[16.67%]">
                      <TableMarketName market={market} side={side} />
                    </Td>
                    {modifyOrderId !== o.orderId.toString() ? (
                      <>
                        <Td className="w-[16.67%] text-right font-mono">
                          <FormatNumericValue
                            value={o.size}
                            decimals={getDecimalCount(minOrderSize)}
                          />
                        </Td>
                        <Td className="w-[16.67%] whitespace-nowrap text-right font-mono">
                          <FormatNumericValue
                            value={o.price}
                            decimals={getDecimalCount(tickSize)}
                          />
                        </Td>
                      </>
                    ) : (
                      <>
                        <Td className="w-[16.67%]">
                          <input
                            className="h-8 w-full rounded-l-none rounded-r-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-bkg-4 bg-transparent px-0 text-right font-mono text-sm hover:border-th-fgd-3 focus:border-th-fgd-3 focus:outline-none"
                            type="text"
                            value={modifiedOrderSize}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              setModifiedOrderSize(e.target.value)
                            }
                          />
                        </Td>
                        <Td className="w-[16.67%]">
                          <input
                            autoFocus
                            className="h-8 w-full rounded-l-none rounded-r-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-bkg-4 bg-transparent px-0 text-right font-mono text-sm hover:border-th-fgd-3 focus:border-th-fgd-3 focus:outline-none"
                            type="text"
                            value={modifiedOrderPrice}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              setModifiedOrderPrice(e.target.value)
                            }
                          />
                        </Td>
                      </>
                    )}
                    <Td className="w-[16.67%] text-right font-mono">
                      <FormatNumericValue value={value} isUsd />
                      {expiryTimestamp ? (
                        <div className="h-min text-xxs leading-tight text-th-fgd-4">{`Expires ${new Date(
                          expiryTimestamp * 1000,
                        ).toLocaleTimeString()}`}</div>
                      ) : null}
                    </Td>
                    {!isUnownedAccount ? (
                      <Td className="w-[16.67%]">
                        <div className="flex justify-end space-x-2">
                          {modifyOrderId !== o.orderId.toString() ? (
                            <>
                              <IconButton
                                onClick={() => showEditOrderForm(o, tickSize)}
                                size="small"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </IconButton>
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
                            </>
                          ) : (
                            <>
                              <IconButton
                                onClick={() => modifyOrder(o)}
                                size="small"
                              >
                                {loadingModifyOrder ? (
                                  <Loading className="h-4 w-4" />
                                ) : (
                                  <CheckIcon className="h-4 w-4" />
                                )}
                              </IconButton>
                              <IconButton
                                onClick={cancelEditOrderForm}
                                size="small"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </IconButton>
                            </>
                          )}
                        </div>
                      </Td>
                    ) : null}
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
            let quoteBank: Bank | undefined
            if (o instanceof PerpOrder) {
              market = group.getPerpMarketByMarketIndex(o.perpMarketIndex)
              tickSize = market.tickSize
              minOrderSize = market.minOrderSize
            } else {
              market = group.getSerum3MarketByExternalMarket(
                new PublicKey(marketPk),
              )
              const serumMarket = group.getSerum3ExternalMarket(
                market.serumMarketExternal,
              )

              quoteBank = group.getFirstBankByTokenIndex(market.quoteTokenIndex)
              tickSize = serumMarket.tickSize
              minOrderSize = serumMarket.minOrderSize
            }
            return (
              <div
                className="flex items-center justify-between border-b border-th-bkg-3 p-4"
                key={`${o.side}${o.size}${o.price}`}
              >
                <div>
                  {modifyOrderId !== o.orderId.toString() ? (
                    <div className="flex items-center">
                      <MarketLogos market={market} size="large" />
                      <div>
                        <div className="flex space-x-1 text-th-fgd-2">
                          {selectedMarket?.name === market.name ? (
                            <span className="whitespace-nowrap">
                              {market.name}
                            </span>
                          ) : (
                            <Link href={`/trade?name=${market.name}`}>
                              <span className="whitespace-nowrap">
                                {market.name}
                              </span>
                            </Link>
                          )}
                          {o instanceof PerpOrder ? (
                            <PerpSideBadge
                              basePosition={'bid' in o.side ? 1 : -1}
                            />
                          ) : (
                            <SideBadge side={o.side} />
                          )}
                        </div>
                        <p className="text-th-fgd-4">
                          <span className="font-mono text-th-fgd-2">
                            <FormatNumericValue
                              value={o.size}
                              decimals={getDecimalCount(minOrderSize)}
                            />
                          </span>
                          {' at '}
                          <span className="font-mono text-th-fgd-2">
                            <FormatNumericValue
                              value={o.price}
                              decimals={getDecimalCount(tickSize)}
                              isUsd={
                                quoteBank?.name === 'USDC' ||
                                o instanceof PerpOrder
                              }
                            />{' '}
                            {quoteBank && quoteBank.name !== 'USDC' ? (
                              <span className="font-body text-th-fgd-3">
                                {quoteBank.name}
                              </span>
                            ) : null}
                          </span>
                        </p>
                        <span className="font-mono text-xs text-th-fgd-3">
                          <FormatNumericValue value={o.price * o.size} isUsd />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-th-fgd-2">{`${t('edit')} ${
                        market.name
                      } ${t('order')}`}</p>
                      <div className="mt-2 flex space-x-4">
                        <div>
                          <p className="text-xs">{t('trade:size')}</p>
                          <Input
                            className="w-full rounded-l-none rounded-r-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-bkg-4 bg-transparent px-0 text-right font-mono hover:border-th-fgd-3 focus:border-th-fgd-3 focus:outline-none"
                            type="text"
                            value={modifiedOrderSize}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              setModifiedOrderSize(e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <p className="text-xs">{t('price')}</p>
                          <Input
                            autoFocus
                            className="w-full rounded-l-none rounded-r-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-bkg-4 bg-transparent px-0 text-right font-mono hover:border-th-fgd-3 focus:border-th-fgd-3 focus:outline-none"
                            type="text"
                            value={modifiedOrderPrice}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              setModifiedOrderPrice(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {!isUnownedAccount ? (
                  <div className="flex items-center space-x-3 pl-8">
                    <div className="flex items-center space-x-2">
                      {modifyOrderId !== o.orderId.toString() ? (
                        <>
                          <IconButton
                            onClick={() => showEditOrderForm(o, tickSize)}
                            size="small"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
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
                        </>
                      ) : (
                        <>
                          <IconButton
                            onClick={() => modifyOrder(o)}
                            size="small"
                          >
                            {loadingModifyOrder ? (
                              <Loading className="h-4 w-4" />
                            ) : (
                              <CheckIcon className="h-4 w-4" />
                            )}
                          </IconButton>
                          <IconButton
                            onClick={cancelEditOrderForm}
                            size="small"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })
        })}
      </div>
    )
  ) : mangoAccountAddress || connected ? (
    <div className="flex flex-col items-center p-8">
      <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>{t('trade:no-orders')}</p>
    </div>
  ) : (
    <div className="p-8">
      <ConnectEmptyState text={t('trade:connect-orders')} />
    </div>
  )
}

export default OpenOrders
