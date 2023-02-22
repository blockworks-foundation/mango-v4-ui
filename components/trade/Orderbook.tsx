import { AccountInfo } from '@solana/web3.js'
import Big from 'big.js'
import mangoStore from '@store/mangoStore'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Market, Orderbook as SpotOrderBook } from '@project-serum/serum'
import isEqual from 'lodash/isEqual'
import useLocalStorageState from 'hooks/useLocalStorageState'
import {
  floorToDecimal,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'
import { useTranslation } from 'next-i18next'
import Decimal from 'decimal.js'
import { OrderbookL2 } from 'types'
import OrderbookIcon from '@components/icons/OrderbookIcon'
import Tooltip from '@components/shared/Tooltip'
import GroupSize from './GroupSize'
import { breakpoints } from '../../utils/theme'
import { useViewport } from 'hooks/useViewport'
import {
  BookSide,
  BookSideType,
  MangoClient,
  PerpMarket,
} from '@blockworks-foundation/mango-v4'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import { ArrowPathIcon } from '@heroicons/react/20/solid'
import { sleep } from 'utils'

export const decodeBookL2 = (book: SpotOrderBook | BookSide): number[][] => {
  const depth = 300
  if (book instanceof SpotOrderBook) {
    return book.getL2(depth).map(([price, size]) => [price, size])
  } else if (book instanceof BookSide) {
    return book.getL2Ui(depth)
  }
  return []
}

function decodeBook(
  client: MangoClient,
  market: Market | PerpMarket,
  accInfo: AccountInfo<Buffer>,
  side: 'bids' | 'asks'
): SpotOrderBook | BookSide {
  if (market instanceof Market) {
    const book = SpotOrderBook.decode(market, accInfo.data)
    return book
  } else {
    const decodedAcc = client.program.coder.accounts.decode(
      'bookSide',
      accInfo.data
    )
    const book = BookSide.from(
      client,
      market,
      side === 'bids' ? BookSideType.bids : BookSideType.asks,
      decodedAcc
    )
    return book
  }
}

type cumOrderbookSide = {
  price: number
  size: number
  cumulativeSize: number
  sizePercent: number
  maxSizePercent: number
  cumulativeSizePercent: number
}

const getCumulativeOrderbookSide = (
  orders: any[],
  totalSize: number,
  maxSize: number,
  depth: number
): cumOrderbookSide[] => {
  const cumulative = orders
    .slice(0, depth)
    .reduce((cumulative, [price, size], i) => {
      const cumulativeSize = (cumulative[i - 1]?.cumulativeSize || 0) + size
      cumulative.push({
        price: Number(price),
        size,
        cumulativeSize,
        sizePercent: Math.round((cumulativeSize / (totalSize || 1)) * 100),
        cumulativeSizePercent: Math.round((size / (cumulativeSize || 1)) * 100),
        maxSizePercent: Math.round((size / (maxSize || 1)) * 100),
      })
      return cumulative
    }, [])

  return cumulative
}

const groupBy = (
  ordersArray: number[][],
  market: PerpMarket | Market,
  grouping: number,
  isBids: boolean
) => {
  if (!ordersArray || !market || !grouping || grouping == market?.tickSize) {
    return ordersArray || []
  }
  const groupFloors: Record<number, number> = {}
  for (let i = 0; i < ordersArray.length; i++) {
    if (typeof ordersArray[i] == 'undefined') {
      break
    }
    const bigGrouping = Big(grouping)
    const bigOrder = Big(ordersArray[i][0])

    const floor = isBids
      ? bigOrder
          .div(bigGrouping)
          .round(0, Big.roundDown)
          .times(bigGrouping)
          .toNumber()
      : bigOrder
          .div(bigGrouping)
          .round(0, Big.roundUp)
          .times(bigGrouping)
          .toNumber()
    if (typeof groupFloors[floor] == 'undefined') {
      groupFloors[floor] = ordersArray[i][1]
    } else {
      groupFloors[floor] = ordersArray[i][1] + groupFloors[floor]
    }
  }
  const sortedGroups = Object.entries(groupFloors)
    .map((entry) => {
      return [
        +parseFloat(entry[0]).toFixed(getDecimalCount(grouping)),
        entry[1],
      ]
    })
    .sort((a: number[], b: number[]) => {
      if (!a || !b) {
        return -1
      }
      return isBids ? b[0] - a[0] : a[0] - b[0]
    })
  return sortedGroups
}

const hasOpenOrderForPriceGroup = (
  openOrderPrices: number[],
  price: number,
  grouping: number
) => {
  return !!openOrderPrices.find((ooPrice) => {
    return ooPrice >= price && ooPrice <= price + grouping
  })
}

const updatePerpMarketOnGroup = (book: BookSide, side: 'bids' | 'asks') => {
  book.perpMarket[`_${side}`] = book
}

const depth = 40
type OrderbookData = {
  bids: cumOrderbookSide[]
  asks: cumOrderbookSide[]
  spread: number
  spreadPercentage: number
}

const Orderbook = () => {
  const { t } = useTranslation(['common', 'trade'])
  const {
    serumOrPerpMarket: market,
    baseSymbol,
    quoteSymbol,
  } = useSelectedMarket()
  const connection = mangoStore((s) => s.connection)

  const [isScrolled, setIsScrolled] = useState(false)
  const [orderbookData, setOrderbookData] = useState<OrderbookData | null>(null)
  const [grouping, setGrouping] = useState(0.01)
  const [showBuys, setShowBuys] = useState(true)
  const [showSells, setShowSells] = useState(true)
  const [userOpenOrderPrices, setUserOpenOrderPrices] = useState<number[]>([])

  const currentOrderbookData = useRef<OrderbookL2>()
  const orderbookElRef = useRef<HTMLDivElement>(null)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  const depthArray = useMemo(() => {
    const bookDepth = !isMobile ? depth : 9
    return Array(bookDepth).fill(0)
  }, [isMobile])

  useEffect(() => {
    if (!market) return
    setGrouping(market.tickSize)
  }, [market])

  const verticallyCenterOrderbook = useCallback(() => {
    const element = orderbookElRef.current
    if (element) {
      if (element.scrollHeight > window.innerHeight) {
        element.scrollTop =
          (element.scrollHeight - element.scrollHeight) / 2 +
          (element.scrollHeight - window.innerHeight) / 2 +
          94
      } else {
        element.scrollTop = (element.scrollHeight - element.offsetHeight) / 2
      }
    }
  }, [])

  useEffect(
    () =>
      mangoStore.subscribe(
        (state) => state.selectedMarket.orderbook,
        (newOrderbook) => {
          if (
            newOrderbook &&
            market &&
            !isEqual(currentOrderbookData.current, newOrderbook)
          ) {
            // check if user has open orders so we can highlight them on orderbook
            const openOrders = mangoStore.getState().mangoAccount.openOrders
            const marketPk = market.publicKey.toString()
            const newUserOpenOrderPrices =
              marketPk && openOrders[marketPk]?.length
                ? openOrders[marketPk]?.map((order) => order.price)
                : []
            setUserOpenOrderPrices(newUserOpenOrderPrices)

            // updated orderbook data
            const bids =
              groupBy(newOrderbook?.bids, market, grouping, true) || []
            const asks =
              groupBy(newOrderbook?.asks, market, grouping, false) || []

            const sum = (total: number, [, size]: number[], index: number) =>
              index < depth ? total + size : total
            const totalSize = bids.reduce(sum, 0) + asks.reduce(sum, 0)

            const maxSize =
              Math.max(
                ...bids.map((b: number[]) => {
                  return b[1]
                })
              ) +
              Math.max(
                ...asks.map((a: number[]) => {
                  return a[1]
                })
              )

            const bidsToDisplay = getCumulativeOrderbookSide(
              bids,
              totalSize,
              maxSize,
              depth
            )
            const asksToDisplay = getCumulativeOrderbookSide(
              asks,
              totalSize,
              maxSize,
              depth
            )

            currentOrderbookData.current = newOrderbook
            if (bidsToDisplay[0] || asksToDisplay[0]) {
              const bid = bidsToDisplay[0]?.price
              const ask = asksToDisplay[0]?.price
              let spread = 0,
                spreadPercentage = 0
              if (bid && ask) {
                spread = ask - bid
                spreadPercentage = (spread / ask) * 100
              }

              setOrderbookData({
                bids: bidsToDisplay,
                asks: asksToDisplay.reverse(),
                spread,
                spreadPercentage,
              })
              if (!isScrolled) {
                verticallyCenterOrderbook()
              }
            } else {
              setOrderbookData(null)
            }
          }
        }
      ),
    [
      grouping,
      market,
      isScrolled,
      verticallyCenterOrderbook,
      userOpenOrderPrices,
    ]
  )

  useEffect(() => {
    const set = mangoStore.getState().set
    const client = mangoStore.getState().client

    if (!market) return

    let bidSubscriptionId: number | undefined = undefined
    let askSubscriptionId: number | undefined = undefined

    const bidsPk =
      market instanceof Market ? market['_decoded'].bids : market.bids
    console.log('bidsPk', bidsPk?.toString())
    if (bidsPk) {
      connection
        .getAccountInfoAndContext(bidsPk)
        .then(({ context, value: info }) => {
          if (!info) return
          const decodedBook = decodeBook(client, market, info, 'bids')
          set((state) => {
            state.selectedMarket.lastSeenSlot.bids = context.slot
            state.selectedMarket.bidsAccount = decodedBook
            state.selectedMarket.orderbook.bids = decodeBookL2(decodedBook)
          })
        })
      bidSubscriptionId = connection.onAccountChange(
        bidsPk,
        (info, context) => {
          const lastSeenSlot =
            mangoStore.getState().selectedMarket.lastSeenSlot.bids
          if (context.slot > lastSeenSlot) {
            const decodedBook = decodeBook(client, market, info, 'bids')
            if (decodedBook instanceof BookSide) {
              updatePerpMarketOnGroup(decodedBook, 'bids')
            }
            set((state) => {
              state.selectedMarket.bidsAccount = decodedBook
              state.selectedMarket.orderbook.bids = decodeBookL2(decodedBook)
              state.selectedMarket.lastSeenSlot.bids = context.slot
            })
          }
        },
        'processed'
      )
    }

    const asksPk =
      market instanceof Market ? market['_decoded'].asks : market.asks
    console.log('asksPk', asksPk?.toString())
    if (asksPk) {
      connection
        .getAccountInfoAndContext(asksPk)
        .then(({ context, value: info }) => {
          if (!info) return
          const decodedBook = decodeBook(client, market, info, 'asks')
          set((state) => {
            state.selectedMarket.asksAccount = decodedBook
            state.selectedMarket.orderbook.asks = decodeBookL2(decodedBook)
            state.selectedMarket.lastSeenSlot.asks = context.slot
          })
        })
      askSubscriptionId = connection.onAccountChange(
        asksPk,
        (info, context) => {
          const lastSeenSlot =
            mangoStore.getState().selectedMarket.lastSeenSlot.asks
          if (context.slot > lastSeenSlot) {
            const decodedBook = decodeBook(client, market, info, 'asks')
            if (decodedBook instanceof BookSide) {
              updatePerpMarketOnGroup(decodedBook, 'asks')
            }
            set((state) => {
              state.selectedMarket.asksAccount = decodedBook
              state.selectedMarket.orderbook.asks = decodeBookL2(decodedBook)
              state.selectedMarket.lastSeenSlot.asks = context.slot
            })
          }
        },
        'processed'
      )
    }
    return () => {
      if (typeof bidSubscriptionId !== 'undefined') {
        connection.removeAccountChangeListener(bidSubscriptionId)
      }
      if (typeof askSubscriptionId !== 'undefined') {
        connection.removeAccountChangeListener(askSubscriptionId)
      }
    }
  }, [market, connection])

  useEffect(() => {
    window.addEventListener('resize', verticallyCenterOrderbook)
    // const id = setTimeout(verticallyCenterOrderbook, 400)
    // return () => clearTimeout(id)
  }, [verticallyCenterOrderbook])

  const resetOrderbook = useCallback(async () => {
    setShowBuys(true)
    setShowSells(true)
    await sleep(300)
    verticallyCenterOrderbook()
  }, [])

  const onGroupSizeChange = useCallback((groupSize: number) => {
    setGrouping(groupSize)
  }, [])

  const handleScroll = useCallback(() => {
    setIsScrolled(true)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-th-bkg-3 px-4 py-2">
        <div id="trade-step-three" className="flex items-center space-x-1.5">
          <Tooltip
            className="hidden md:block"
            content={showBuys ? t('trade:hide-bids') : t('trade:show-bids')}
            placement="bottom"
          >
            <button
              className={`rounded ${
                showBuys ? 'bg-th-bkg-3' : 'bg-th-bkg-2'
              } default-transition flex h-6 w-6 items-center justify-center hover:border-th-fgd-4 focus:outline-none disabled:cursor-not-allowed`}
              onClick={() => setShowBuys(!showBuys)}
              disabled={!showSells}
            >
              <OrderbookIcon className="h-4 w-4" side="buy" />
            </button>
          </Tooltip>
          <Tooltip
            className="hidden md:block"
            content={showSells ? t('trade:hide-asks') : t('trade:show-asks')}
            placement="bottom"
          >
            <button
              className={`rounded ${
                showSells ? 'bg-th-bkg-3' : 'bg-th-bkg-2'
              } default-transition flex h-6 w-6 items-center justify-center hover:border-th-fgd-4 focus:outline-none disabled:cursor-not-allowed`}
              onClick={() => setShowSells(!showSells)}
              disabled={!showBuys}
            >
              <OrderbookIcon className="h-4 w-4" side="sell" />
            </button>
          </Tooltip>
          <Tooltip
            className="hidden md:block"
            content={'Reset and center orderbook'}
            placement="bottom"
          >
            <button
              className={`rounded ${
                showSells ? 'bg-th-bkg-3' : 'bg-th-bkg-2'
              } default-transition flex h-6 w-6 items-center justify-center hover:border-th-fgd-4 focus:outline-none disabled:cursor-not-allowed`}
              onClick={resetOrderbook}
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
        {market ? (
          <div id="trade-step-four">
            <Tooltip
              className="hidden md:block"
              content={t('trade:grouping')}
              placement="left"
              delay={250}
            >
              <GroupSize
                tickSize={market.tickSize}
                onChange={onGroupSizeChange}
                value={grouping}
              />
            </Tooltip>
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 px-4 pt-2 pb-1 text-xxs text-th-fgd-4">
        <div className="col-span-1 text-right">
          {t('trade:size')} ({baseSymbol})
        </div>
        <div className="col-span-1 text-right">
          {t('price')} ({quoteSymbol})
        </div>
      </div>
      <div
        className="hide-scroll relative h-full overflow-y-scroll"
        ref={orderbookElRef}
        onScroll={handleScroll}
      >
        {showSells
          ? depthArray.map((_x, idx) => {
              let index = idx
              if (orderbookData?.asks) {
                const lengthDiff = depthArray.length - orderbookData.asks.length
                if (lengthDiff > 0) {
                  index = index < lengthDiff ? -1 : Math.abs(lengthDiff - index)
                }
              }
              return (
                <div className="h-[24px]" key={idx}>
                  {!!orderbookData?.asks[index] && market ? (
                    <MemoizedOrderbookRow
                      minOrderSize={market.minOrderSize}
                      tickSize={market.tickSize}
                      hasOpenOrder={hasOpenOrderForPriceGroup(
                        userOpenOrderPrices,
                        orderbookData?.asks[index].price,
                        grouping
                      )}
                      key={orderbookData?.asks[index].price}
                      price={orderbookData?.asks[index].price}
                      size={orderbookData?.asks[index].size}
                      side="sell"
                      sizePercent={orderbookData?.asks[index].sizePercent}
                      cumulativeSizePercent={
                        orderbookData?.asks[index].cumulativeSizePercent
                      }
                      grouping={grouping}
                    />
                  ) : null}
                </div>
              )
            })
          : null}
        {showBuys && showSells ? (
          <div
            className="my-2 grid grid-cols-2 border-y border-th-bkg-3 py-2 px-4 text-xs text-th-fgd-4"
            id="trade-step-nine"
          >
            <div className="col-span-1 flex justify-between">
              <div className="text-xxs">{t('trade:spread')}</div>
              <div className="font-mono">
                {orderbookData?.spreadPercentage.toFixed(2)}%
              </div>
            </div>
            <div className="col-span-1 text-right font-mono">
              {orderbookData?.spread
                ? formatNumericValue(
                    orderbookData.spread,
                    market ? getDecimalCount(market.tickSize) : undefined
                  )
                : null}
            </div>
          </div>
        ) : null}
        {showBuys
          ? depthArray.map((_x, index) => (
              <div className="h-[24px]" key={index}>
                {!!orderbookData?.bids[index] && market ? (
                  <MemoizedOrderbookRow
                    minOrderSize={market.minOrderSize}
                    tickSize={market.tickSize}
                    hasOpenOrder={hasOpenOrderForPriceGroup(
                      userOpenOrderPrices,
                      orderbookData?.bids[index].price,
                      grouping
                    )}
                    price={orderbookData?.bids[index].price}
                    size={orderbookData?.bids[index].size}
                    side="buy"
                    sizePercent={orderbookData?.bids[index].sizePercent}
                    cumulativeSizePercent={
                      orderbookData?.bids[index].cumulativeSizePercent
                    }
                    grouping={grouping}
                  />
                ) : null}
              </div>
            ))
          : null}
      </div>
    </div>
  )
}

const OrderbookRow = ({
  side,
  price,
  size,
  sizePercent,
  // invert,
  hasOpenOrder,
  minOrderSize,
  cumulativeSizePercent,
  tickSize,
  grouping,
}: {
  side: 'buy' | 'sell'
  price: number
  size: number
  sizePercent: number
  cumulativeSizePercent: number
  hasOpenOrder: boolean
  // invert: boolean
  grouping: number
  minOrderSize: number
  tickSize: number
}) => {
  const element = useRef<HTMLDivElement>(null)
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS
  )
  const flashClassName = side === 'sell' ? 'red-flash' : 'green-flash'

  useEffect(() => {
    animationSettings['orderbook-flash'].active &&
      !element.current?.classList.contains(`${flashClassName}`) &&
      element.current?.classList.add(`${flashClassName}`)
    const id = setTimeout(
      () =>
        element.current?.classList.contains(`${flashClassName}`) &&
        element.current?.classList.remove(`${flashClassName}`),
      500
    )
    return () => clearTimeout(id)
  }, [price, size])

  const formattedSize = useMemo(() => {
    return minOrderSize && !isNaN(size)
      ? floorToDecimal(size, getDecimalCount(minOrderSize))
      : new Decimal(size)
  }, [size, minOrderSize])

  const formattedPrice = useMemo(() => {
    return tickSize && !isNaN(price)
      ? floorToDecimal(price, getDecimalCount(tickSize))
      : new Decimal(price)
  }, [price, tickSize])

  const handlePriceClick = useCallback(() => {
    const set = mangoStore.getState().set
    set((state) => {
      state.tradeForm.price = formattedPrice.toFixed()
      if (state.tradeForm.baseSize && state.tradeForm.tradeType === 'Limit') {
        const quoteSize = floorToDecimal(
          formattedPrice.mul(new Decimal(state.tradeForm.baseSize)),
          getDecimalCount(tickSize)
        )
        state.tradeForm.quoteSize = quoteSize.toFixed()
      }
    })
  }, [formattedPrice, tickSize])

  const handleSizeClick = useCallback(() => {
    const set = mangoStore.getState().set
    set((state) => {
      state.tradeForm.baseSize = formattedSize.toString()
      if (formattedSize && state.tradeForm.price) {
        const quoteSize = floorToDecimal(
          formattedSize.mul(new Decimal(state.tradeForm.price)),
          getDecimalCount(tickSize)
        )
        state.tradeForm.quoteSize = quoteSize.toString()
      }
    })
  }, [formattedSize, tickSize])

  const groupingDecimalCount = useMemo(
    () => getDecimalCount(grouping),
    [grouping]
  )
  const minOrderSizeDecimals = useMemo(
    () => getDecimalCount(minOrderSize),
    [minOrderSize]
  )

  if (!minOrderSize) return null

  return (
    <div
      className={`relative flex h-[24px] cursor-pointer justify-between border-b border-b-th-bkg-1 text-sm`}
      ref={element}
    >
      <>
        <div className="flex h-full w-full items-center justify-between text-th-fgd-3 hover:bg-th-bkg-2">
          <div
            className="flex h-full w-full items-center justify-start pl-2 hover:underline"
            onClick={handleSizeClick}
          >
            <div
              style={{ fontFeatureSettings: 'zero 1' }}
              className={`z-10 w-full text-right font-mono text-xs ${
                hasOpenOrder ? 'text-th-active' : ''
              }`}
              // onClick={handleSizeClick}
            >
              {formattedSize.toFixed(minOrderSizeDecimals)}
            </div>
          </div>
          <div
            className={`z-10 flex h-full w-full items-center pr-4 hover:underline`}
            onClick={handlePriceClick}
          >
            <div className="w-full text-right font-mono text-xs">
              {formattedPrice.toFixed(groupingDecimalCount)}
            </div>
          </div>
        </div>

        <Line
          className={`absolute left-0 opacity-40 brightness-125 ${
            side === 'buy' ? `bg-th-up-muted` : `bg-th-down-muted`
          }`}
          data-width={Math.max(sizePercent, 0.5) + '%'}
        />
        <Line
          className={`absolute left-0 opacity-70 ${
            side === 'buy' ? `bg-th-up` : `bg-th-down`
          }`}
          data-width={
            Math.max((cumulativeSizePercent / 100) * sizePercent, 0.1) + '%'
          }
        />
      </>
    </div>
  )
}

const MemoizedOrderbookRow = React.memo(OrderbookRow)

const Line = (props: {
  className: string
  invert?: boolean
  'data-width': string
}) => {
  return (
    <div
      className={`${props.className}`}
      style={{
        textAlign: props.invert ? 'left' : 'right',
        height: '100%',
        width: `${props['data-width'] ? props['data-width'] : ''}`,
      }}
    />
  )
}

export default Orderbook
