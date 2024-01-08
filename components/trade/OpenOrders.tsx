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
import SheenLoader from '@components/shared/SheenLoader'
import SideBadge from '@components/shared/SideBadge'
import {
  SortableColumnHeader,
  Table,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
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
import useFilledOrders from 'hooks/useFilledOrders'
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
import { useSortableData } from 'hooks/useSortableData'
import { BN } from '@project-serum/anchor'

type TableData = {
  expiryTimestamp: number | undefined
  filledQuantity: number
  market: Serum3Market | PerpMarket
  marketName: string
  minOrderSize: number
  order: Order | PerpOrder
  orderId: BN
  price: number
  side: string
  size: number
  tickSize: number
  value: number
}

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

const OpenOrders = ({
  filterForCurrentMarket,
}: {
  filterForCurrentMarket?: boolean
}) => {
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
  const { filledOrders, fetchingFilledOrders } = useFilledOrders()

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
        actions.fetchOpenOrders(true)
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

  const formattedTableData = useCallback(() => {
    const group = mangoStore.getState().group
    if (!group) return []
    const formatted: TableData[] = []

    Object.entries(openOrders)
      .sort()
      .filter((orders) => {
        if (filterForCurrentMarket) {
          const marketPk =
            selectedMarket instanceof Serum3Market
              ? selectedMarket.serumMarketExternal.toString()
              : selectedMarket?.publicKey.toString()
          return orders[0] === marketPk
        } else return orders
      })
      .map(([marketPk, orders]) => {
        for (const order of orders) {
          let market: PerpMarket | Serum3Market
          let tickSize: number
          let minOrderSize: number
          let expiryTimestamp: number | undefined
          let value: number
          let filledQuantity = 0
          if (order instanceof PerpOrder) {
            market = group.getPerpMarketByMarketIndex(order.perpMarketIndex)
            tickSize = market.tickSize
            minOrderSize = market.minOrderSize
            expiryTimestamp =
              order.expiryTimestamp === U64_MAX_BN
                ? 0
                : order.expiryTimestamp.toNumber()
            value = order.size * order.price

            // Find the filled perp order,
            // the api returns client order ids for perps, but PerpOrder[] only has orderId
            const mangoAccount = mangoStore.getState().mangoAccount.current
            const perpClientId = mangoAccount?.perpOpenOrders?.find((p) =>
              p.id.eq(order.orderId),
            )?.clientId
            if (perpClientId) {
              const filledOrder = filledOrders?.fills?.find(
                (f) => f.order_id == perpClientId.toString(),
              )
              filledQuantity = filledOrder ? filledOrder.quantity : 0
            }
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
            value = order.size * order.price * quoteBank.uiPrice
            const filledOrder = filledOrders?.fills?.find(
              (f) => order.orderId.toString() === f.order_id,
            )
            filledQuantity = filledOrder ? filledOrder.quantity : 0
          }
          const side =
            order instanceof PerpOrder
              ? 'bid' in order.side
                ? 'long'
                : 'short'
              : order.side
          const price = order.price
          const size = order.size
          const orderId = order.orderId
          const marketName = market.name

          const data = {
            expiryTimestamp,
            filledQuantity,
            market,
            marketName,
            minOrderSize,
            order,
            orderId,
            price,
            side,
            size,
            tickSize,
            value,
          }
          formatted.push(data)
        }
      })

    return formatted
  }, [filledOrders, filterForCurrentMarket, openOrders, selectedMarket])

  const {
    items: tableData,
    requestSort,
    sortConfig,
  } = useSortableData(formattedTableData())

  return mangoAccountAddress && tableData.length ? (
    showTableView ? (
      <Table>
        <thead>
          <TrHead>
            <Th className="text-left">
              <SortableColumnHeader
                sortKey="marketName"
                sort={() => requestSort('marketName')}
                sortConfig={sortConfig}
                title={t('market')}
              />
            </Th>
            <Th>
              <div className="flex justify-end">
                <SortableColumnHeader
                  sortKey="size"
                  sort={() => requestSort('size')}
                  sortConfig={sortConfig}
                  title={t('trade:size')}
                />
              </div>
            </Th>
            <Th>
              <div className="flex justify-end">
                <SortableColumnHeader
                  sortKey="price"
                  sort={() => requestSort('price')}
                  sortConfig={sortConfig}
                  title={t('price')}
                />
              </div>
            </Th>
            <Th>
              <div className="flex justify-end">
                <SortableColumnHeader
                  sortKey="filledQuantity"
                  sort={() => requestSort('filledQuantity')}
                  sortConfig={sortConfig}
                  title={t('trade:filled')}
                />
              </div>
            </Th>
            <Th>
              <div className="flex justify-end">
                <SortableColumnHeader
                  sortKey="value"
                  sort={() => requestSort('value')}
                  sortConfig={sortConfig}
                  title={t('value')}
                />
              </div>
            </Th>
            {!isUnownedAccount ? (
              <Th className="w-[14.28%] text-right" />
            ) : null}
          </TrHead>
        </thead>
        <tbody>
          {tableData.map((data) => {
            const {
              expiryTimestamp,
              filledQuantity,
              market,
              minOrderSize,
              order,
              orderId,
              price,
              side,
              size,
              tickSize,
              value,
            } = data
            return (
              <TrBody
                key={`${side}${size}${price}${orderId.toString()}`}
                className="my-1 p-2"
              >
                <Td className="w-[14.28%]">
                  <TableMarketName market={market} side={side} />
                </Td>
                {modifyOrderId !== orderId.toString() ? (
                  <>
                    <Td className="w-[14.28%] text-right font-mono">
                      <FormatNumericValue
                        value={size}
                        decimals={getDecimalCount(minOrderSize)}
                      />
                    </Td>
                    <Td className="w-[14.28%] whitespace-nowrap text-right font-mono">
                      <FormatNumericValue
                        value={price}
                        decimals={getDecimalCount(tickSize)}
                      />
                    </Td>
                  </>
                ) : (
                  <>
                    <Td className="w-[14.28%]">
                      <input
                        className="h-8 w-full rounded-l-none rounded-r-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-bkg-4 bg-transparent px-0 text-right font-mono text-sm hover:border-th-fgd-3 focus:border-th-fgd-3 focus:outline-none"
                        type="text"
                        value={modifiedOrderSize}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setModifiedOrderSize(e.target.value)
                        }
                      />
                    </Td>
                    <Td className="w-[14.28%]">
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
                <Td className="w-[14.28%] text-right font-mono">
                  {fetchingFilledOrders ? (
                    <div className="items flex justify-end">
                      <SheenLoader className="flex justify-end">
                        <div className="h-4 w-8 bg-th-bkg-2" />
                      </SheenLoader>
                    </div>
                  ) : (
                    <FormatNumericValue
                      value={filledQuantity}
                      decimals={getDecimalCount(minOrderSize)}
                    />
                  )}
                </Td>
                <Td className="w-[14.28%] text-right font-mono">
                  <FormatNumericValue value={value} isUsd />
                  {expiryTimestamp ? (
                    <div className="h-min text-xxs leading-tight text-th-fgd-4">{`Expires ${new Date(
                      expiryTimestamp * 1000,
                    ).toLocaleTimeString()}`}</div>
                  ) : null}
                </Td>
                {!isUnownedAccount ? (
                  <Td className="w-[14.28%]">
                    <div className="flex justify-end space-x-2">
                      {modifyOrderId !== orderId.toString() ? (
                        <>
                          <IconButton
                            onClick={() => showEditOrderForm(order, tickSize)}
                            size="small"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <Tooltip content={t('cancel')}>
                            <IconButton
                              disabled={cancelId === orderId.toString()}
                              onClick={() =>
                                order instanceof PerpOrder
                                  ? handleCancelPerpOrder(order)
                                  : handleCancelSerumOrder(order)
                              }
                              size="small"
                            >
                              {cancelId === orderId.toString() ? (
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
                            onClick={() => modifyOrder(order)}
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
          })}
        </tbody>
      </Table>
    ) : (
      <div>
        {tableData.map((data) => {
          const {
            expiryTimestamp,
            market,
            minOrderSize,
            order,
            orderId,
            price,
            side,
            size,
            tickSize,
            value,
          } = data

          let quoteBank: Bank | undefined
          const group = mangoStore.getState().group
          if (market instanceof Serum3Market && group) {
            const externalMarket = group.getSerum3MarketByExternalMarket(
              market.serumMarketExternal,
            )
            quoteBank = group.getFirstBankByTokenIndex(
              externalMarket.quoteTokenIndex,
            )
          }
          return (
            <div
              className="flex items-center justify-between border-b border-th-bkg-3 p-4"
              key={`${side}${size}${price}${orderId.toString()}`}
            >
              <div>
                {modifyOrderId !== orderId.toString() ? (
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
                        {order instanceof PerpOrder ? (
                          <PerpSideBadge
                            basePosition={'bid' in order.side ? 1 : -1}
                          />
                        ) : (
                          <SideBadge side={side} />
                        )}
                      </div>
                      <p className="text-th-fgd-4">
                        <span className="font-mono text-th-fgd-2">
                          <FormatNumericValue
                            value={size}
                            decimals={getDecimalCount(minOrderSize)}
                          />
                        </span>
                        {' at '}
                        <span className="font-mono text-th-fgd-2">
                          <FormatNumericValue
                            value={price}
                            decimals={getDecimalCount(tickSize)}
                            isUsd={
                              quoteBank?.name === 'USDC' ||
                              order instanceof PerpOrder
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
                        <FormatNumericValue value={value} isUsd />
                      </span>
                      {expiryTimestamp ? (
                        <div className="h-min text-xxs leading-tight text-th-fgd-4">{`Expires ${new Date(
                          expiryTimestamp * 1000,
                        ).toLocaleTimeString()}`}</div>
                      ) : null}
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
                    {modifyOrderId !== orderId.toString() ? (
                      <>
                        <IconButton
                          onClick={() => showEditOrderForm(order, tickSize)}
                          size="small"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          disabled={cancelId === orderId.toString()}
                          onClick={() =>
                            order instanceof PerpOrder
                              ? handleCancelPerpOrder(order)
                              : handleCancelSerumOrder(order)
                          }
                          size="small"
                        >
                          {cancelId === orderId.toString() ? (
                            <Loading className="h-4 w-4" />
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          onClick={() => modifyOrder(order)}
                          size="small"
                        >
                          {loadingModifyOrder ? (
                            <Loading className="h-4 w-4" />
                          ) : (
                            <CheckIcon className="h-4 w-4" />
                          )}
                        </IconButton>
                        <IconButton onClick={cancelEditOrderForm} size="small">
                          <XMarkIcon className="h-4 w-4" />
                        </IconButton>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    )
  ) : mangoAccountAddress || connected ? (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="flex flex-col items-center p-8">
        <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
        <p>{t('trade:no-orders')}</p>
      </div>
    </div>
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <ConnectEmptyState text={t('trade:connect-orders')} />
    </div>
  )
}

export default OpenOrders
