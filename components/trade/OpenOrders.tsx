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
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useCallback, useState } from 'react'
import { notify } from 'utils/notifications'
import { formatFixedDecimals, getDecimalCount } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import TableMarketName from './TableMarketName'

const OpenOrders = () => {
  const { t } = useTranslation(['common', 'trade'])
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const [cancelId, setCancelId] = useState<string>('')
  const [modifyOrderId, setModifyOrderId] = useState<string | undefined>(
    undefined
  )
  const [loadingModifyOrder, setLoadingModifyOrder] = useState(false)
  const [modifiedOrderSize, setModifiedOrderSize] = useState('')
  const [modifiedOrderPrice, setModifiedOrderPrice] = useState('')
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const { mangoAccountAddress } = useMangoAccount()
  const { connected } = useWallet()

  const findSerum3MarketPkInOpenOrders = (o: Order): string | undefined => {
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
        new PublicKey(marketPk)
      )

      setCancelId(o.orderId.toString())
      try {
        const tx = await client.serum3CancelOrder(
          group,
          mangoAccount,
          market!.serumMarketExternal,
          o.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
          o.orderId
        )

        actions.fetchOpenOrders()
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
    [t, openOrders]
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
        let tx = ''
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
            undefined
          )
        } else {
          const marketPk = findSerum3MarketPkInOpenOrders(o)
          if (!marketPk) return
          const market = group.getSerum3MarketByExternalMarket(
            new PublicKey(marketPk)
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
            10
          )
        }
        actions.fetchOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx,
        })
      } catch (e: any) {
        console.error('Error canceling', e)
        notify({
          title: 'Unable to modify order',
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      } finally {
        cancelEditOrderForm()
      }
    },
    [t, modifiedOrderSize, modifiedOrderPrice]
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
            <Th className="w-[16.67%] text-right">{t('trade:side')}</Th>
            <Th className="w-[16.67%] text-right">{t('trade:size')}</Th>
            <Th className="w-[16.67%] text-right">{t('price')}</Th>
            <Th className="w-[16.67%] text-right">{t('value')}</Th>
            <Th className="w-[16.67%] text-right"></Th>
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
                    <Td className="w-[16.67%]">
                      <TableMarketName market={market} />
                    </Td>
                    <Td className="w-[16.67%] text-right">
                      <SideBadge side={o.side} />
                    </Td>
                    {modifyOrderId !== o.orderId.toString() ? (
                      <>
                        <Td className="w-[16.67%] text-right font-mono">
                          {o.size.toLocaleString(undefined, {
                            maximumFractionDigits:
                              getDecimalCount(minOrderSize),
                          })}
                        </Td>
                        <Td className="w-[16.67%] whitespace-nowrap text-right">
                          <span className="font-mono">
                            {o.price.toLocaleString(undefined, {
                              minimumFractionDigits: getDecimalCount(tickSize),
                              maximumFractionDigits: getDecimalCount(tickSize),
                            })}{' '}
                            <span className="font-body text-th-fgd-4">
                              {quoteSymbol}
                            </span>
                          </span>
                        </Td>
                      </>
                    ) : (
                      <>
                        <Td className="w-[16.67%]">
                          <Input
                            className="default-transition h-7 w-full rounded-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-bkg-4 bg-transparent px-0 text-right font-mono hover:border-th-fgd-3 focus:border-th-active focus:outline-none"
                            type="text"
                            value={modifiedOrderSize}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              setModifiedOrderSize(e.target.value)
                            }
                          />
                        </Td>
                        <Td className="w-[16.67%]">
                          <Input
                            autoFocus
                            className="default-transition h-7 w-full rounded-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-bkg-4 bg-transparent px-0 text-right font-mono hover:border-th-fgd-3 focus:border-th-active focus:outline-none"
                            type="text"
                            value={modifiedOrderPrice}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              setModifiedOrderPrice(e.target.value)
                            }
                          />
                        </Td>
                      </>
                    )}
                    <Td className="w-[16.67%] text-right">
                      {formatFixedDecimals(o.size * o.price, true, true)}
                    </Td>
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
                <div>
                  <TableMarketName market={market} />
                  {modifyOrderId !== o.orderId.toString() ? (
                    <div className="mt-1 flex items-center space-x-1">
                      <SideBadge side={o.side} />
                      <p className="text-th-fgd-4">
                        <span className="font-mono text-th-fgd-3">
                          {o.size.toLocaleString(undefined, {
                            maximumFractionDigits:
                              getDecimalCount(minOrderSize),
                          })}
                        </span>{' '}
                        {baseSymbol}
                        {' for '}
                        <span className="font-mono text-th-fgd-3">
                          {o.price.toLocaleString(undefined, {
                            minimumFractionDigits: getDecimalCount(tickSize),
                            maximumFractionDigits: getDecimalCount(tickSize),
                          })}
                        </span>{' '}
                        {quoteSymbol}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 flex space-x-4">
                      <div>
                        <p className="text-xs">{t('trade:size')}</p>
                        <Input
                          className="default-transition h-7 w-full rounded-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-bkg-4 bg-transparent px-0 text-right font-mono hover:border-th-fgd-3 focus:border-th-active focus:outline-none"
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
                          className="default-transition h-7 w-full rounded-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-bkg-4 bg-transparent px-0 text-right font-mono hover:border-th-fgd-3 focus:border-th-active focus:outline-none"
                          type="text"
                          value={modifiedOrderPrice}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setModifiedOrderPrice(e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
                {connected ? (
                  <div className="flex items-center space-x-3 pl-8">
                    <div className="flex items-center space-x-2">
                      {modifyOrderId !== o.orderId.toString() ? (
                        <>
                          <IconButton
                            onClick={() => showEditOrderForm(o, tickSize)}
                            size="medium"
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
                            size="medium"
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
                            size="medium"
                          >
                            {loadingModifyOrder ? (
                              <Loading className="h-4 w-4" />
                            ) : (
                              <CheckIcon className="h-4 w-4" />
                            )}
                          </IconButton>
                          <IconButton
                            onClick={cancelEditOrderForm}
                            size="medium"
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
