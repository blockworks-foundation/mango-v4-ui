import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Market } from '@project-serum/serum'
import useLocalStorageState from 'hooks/useLocalStorageState'
import {
  floorToDecimal,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import {
  ANIMATION_SETTINGS_KEY,
  // USE_ORDERBOOK_FEED_KEY,
} from 'utils/constants'
import { useTranslation } from 'next-i18next'
import Decimal from 'decimal.js'
import Tooltip from '@components/shared/Tooltip'
import GroupSize from './GroupSize'
// import { useViewport } from 'hooks/useViewport'
import { BookSide, Serum3Market } from '@blockworks-foundation/mango-v4'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import { OrderbookFeed } from '@blockworks-foundation/mango-feeds'
// import { breakpoints } from 'utils/theme'
import {
  decodeBook,
  decodeBookL2,
  getCumulativeOrderbookSide,
  getMarket,
  groupBy,
  updatePerpMarketOnGroup,
} from 'utils/orderbook'
import { OrderbookData, OrderbookL2 } from 'types'
import isEqual from 'lodash/isEqual'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'

const sizeCompacter = Intl.NumberFormat('en', {
  maximumFractionDigits: 6,
  notation: 'compact',
})

const SHOW_EXPONENTIAL_THRESHOLD = 0.00001

const Orderbook = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { serumOrPerpMarket: market } = useSelectedMarket()
  const connection = mangoStore((s) => s.connection)

  const [tickSize, setTickSize] = useState(0)
  const [grouping, setGrouping] = useState(0.01)
  const [useOrderbookFeed, setUseOrderbookFeed] = useState(false)
  const orderbookElRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  // const [useOrderbookFeed, setUseOrderbookFeed] = useState(
  //   localStorage.getItem(USE_ORDERBOOK_FEED_KEY) !== null
  //     ? localStorage.getItem(USE_ORDERBOOK_FEED_KEY) === 'true'
  //     : true
  // )
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  const [orderbookData, setOrderbookData] = useState<OrderbookData | null>(null)
  const currentOrderbookData = useRef<OrderbookL2>()

  const depth = useMemo(() => {
    return isMobile ? 12 : 30
  }, [isMobile])

  const depthArray: number[] = useMemo(() => {
    return Array(depth).fill(0)
  }, [depth])

  const verticallyCenterOrderbook = useCallback(() => {
    const element = orderbookElRef.current
    if (element) {
      if (
        element.parentElement &&
        element.scrollHeight > element.parentElement.offsetHeight
      ) {
        element.scrollTop =
          (element.scrollHeight - element.scrollHeight) / 2 +
          (element.scrollHeight - element.parentElement.offsetHeight) / 2 +
          60
      } else {
        element.scrollTop = (element.scrollHeight - element.offsetHeight) / 2
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('resize', verticallyCenterOrderbook)
  }, [verticallyCenterOrderbook])

  const handleScroll = useCallback(() => {
    setIsScrolled(true)
  }, [])

  const orderbookFeed = useRef<OrderbookFeed | null>(null)

  useEffect(() => {
    if (market && market.tickSize !== tickSize) {
      setTickSize(market.tickSize)
      setGrouping(market.tickSize)
    }
  }, [market, tickSize])

  const bidAccountAddress = useMemo(() => {
    if (!market) return ''
    const bidsPk =
      market instanceof Market ? market['_decoded'].bids : market.bids
    return bidsPk.toString()
  }, [market])

  const askAccountAddress = useMemo(() => {
    if (!market) return ''
    const asksPk =
      market instanceof Market ? market['_decoded'].asks : market.asks
    return asksPk.toString()
  }, [market])

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
            const bids2 = mangoStore.getState().selectedMarket.bidsAccount
            const asks2 = mangoStore.getState().selectedMarket.asksAccount
            const mangoAccount = mangoStore.getState().mangoAccount.current
            let usersOpenOrderPrices: number[] = []
            if (
              mangoAccount &&
              bids2 &&
              asks2 &&
              bids2 instanceof BookSide &&
              asks2 instanceof BookSide
            ) {
              usersOpenOrderPrices = [...bids2.items(), ...asks2.items()]
                .filter((order) => order.owner.equals(mangoAccount.publicKey))
                .map((order) => order.price)
            } else {
              usersOpenOrderPrices =
                marketPk && openOrders[marketPk]?.length
                  ? openOrders[marketPk]?.map((order) => order.price)
                  : []
            }

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
                }),
              ) +
              Math.max(
                ...asks.map((a: number[]) => {
                  return a[1]
                }),
              )
            const isGrouped = grouping !== market.tickSize
            const bidsToDisplay = getCumulativeOrderbookSide(
              bids,
              totalSize,
              maxSize,
              depth,
              usersOpenOrderPrices,
              grouping,
              isGrouped,
            )
            const asksToDisplay = getCumulativeOrderbookSide(
              asks,
              totalSize,
              maxSize,
              depth,
              usersOpenOrderPrices,
              grouping,
              isGrouped,
            )

            currentOrderbookData.current = newOrderbook
            if (bidsToDisplay[0] || asksToDisplay[0]) {
              const bid = bidsToDisplay[0]?.price
              const ask = asksToDisplay[0]?.price
              let spread = 0,
                spreadPercentage = 0
              if (bid && ask) {
                spread = parseFloat(
                  (ask - bid).toFixed(getDecimalCount(market.tickSize)),
                )
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
        },
      ),
    [depth, grouping, market],
  )

  // subscribe to the bids and asks orderbook accounts
  useEffect(() => {
    const set = mangoStore.getState().set
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const market = getMarket()
    if (!group || !market) return

    if (useOrderbookFeed) {
      if (!orderbookFeed.current) {
        orderbookFeed.current = new OrderbookFeed(
          `wss://api.mngo.cloud/orderbook/v1/`,
          {
            reconnectionIntervalMs: 5_000,
            reconnectionMaxAttempts: 6,
          },
        )
      }

      let hasConnected = false
      orderbookFeed.current.onConnect(() => {
        if (!orderbookFeed.current) return
        console.log('[OrderbookFeed] connected')
        hasConnected = true
        orderbookFeed.current.subscribe({
          marketId: market.publicKey.toBase58(),
        })
      })

      orderbookFeed.current.onDisconnect((reconnectionAttemptsExhausted) => {
        // fallback to rpc if we couldn't reconnect or if we never connected
        if (reconnectionAttemptsExhausted || !hasConnected) {
          console.warn('[OrderbookFeed] disconnected')
          setUseOrderbookFeed(false)
        } else {
          console.log('[OrderbookFeed] reconnecting...')
        }
      })

      let lastWriteVersion = 0
      orderbookFeed.current.onL2Update((update) => {
        const selectedMarket = mangoStore.getState().selectedMarket
        if (!useOrderbookFeed || !selectedMarket || !selectedMarket.current)
          return
        const selectedMarketKey =
          selectedMarket.current instanceof Serum3Market
            ? selectedMarket.current['serumMarketExternal']
            : selectedMarket.current.publicKey
        if (update.market != selectedMarketKey.toBase58()) return

        // ensure updates are applied in the correct order by checking slot and writeVersion
        const lastSeenSlot =
          update.side == 'bid'
            ? mangoStore.getState().selectedMarket.lastSeenSlot.bids
            : mangoStore.getState().selectedMarket.lastSeenSlot.asks
        if (update.slot < lastSeenSlot) return
        if (
          update.slot == lastSeenSlot &&
          update.writeVersion < lastWriteVersion
        )
          return
        lastWriteVersion = update.writeVersion

        const bookside =
          update.side == 'bid'
            ? selectedMarket.orderbook.bids
            : selectedMarket.orderbook.asks
        const new_bookside = Array.from(bookside)

        for (const diff of update.update) {
          // find existing level for each update
          const levelIndex = new_bookside.findIndex(
            (level) => level && level.length && level[0] === diff[0],
          )
          if (diff[1] > 0) {
            // level being added or updated
            if (levelIndex !== -1) {
              new_bookside[levelIndex] = diff
            } else {
              // add new level and resort
              new_bookside.push(diff)
              new_bookside.sort((a, b) => {
                return update.side == 'bid' ? b[0] - a[0] : a[0] - b[0]
              })
            }
          } else {
            // level being removed if zero size
            if (levelIndex !== -1) {
              new_bookside.splice(levelIndex, 1)
            } else {
              console.warn('[OrderbookFeed] tried to remove missing level')
            }
          }
        }
        set((state) => {
          if (update.side == 'bid') {
            state.selectedMarket.bidsAccount = undefined
            state.selectedMarket.orderbook.bids = new_bookside
            state.selectedMarket.lastSeenSlot.bids = update.slot
          } else {
            state.selectedMarket.asksAccount = undefined
            state.selectedMarket.orderbook.asks = new_bookside
            state.selectedMarket.lastSeenSlot.asks = update.slot
          }
        })
      })
      orderbookFeed.current.onL2Checkpoint((checkpoint) => {
        if (
          !useOrderbookFeed ||
          checkpoint.market !== market.publicKey.toBase58()
        )
          return
        set((state) => {
          state.selectedMarket.lastSeenSlot.bids = checkpoint.slot
          state.selectedMarket.lastSeenSlot.asks = checkpoint.slot
          state.selectedMarket.bidsAccount = undefined
          state.selectedMarket.asksAccount = undefined
          state.selectedMarket.orderbook.bids = checkpoint.bids
          state.selectedMarket.orderbook.asks = checkpoint.asks
        })
      })

      return () => {
        if (!orderbookFeed.current) return
        console.log(
          `[OrderbookFeed] unsubscribe ${market.publicKey.toBase58()}`,
        )
        orderbookFeed.current.unsubscribe(market.publicKey.toBase58())
      }
    } else {
      console.log(`[OrderbookRPC] subscribe ${market.publicKey.toBase58()}`)

      let bidSubscriptionId: number | undefined = undefined
      let askSubscriptionId: number | undefined = undefined
      const bidsPk = new PublicKey(bidAccountAddress)
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
              const market = getMarket()
              if (!market) return
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
          'processed',
        )
      }

      const asksPk = new PublicKey(askAccountAddress)
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
              const market = getMarket()
              if (!market) return
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
          'processed',
        )
      }
      return () => {
        console.log(`[OrderbookRPC] unsubscribe ${market.publicKey.toBase58()}`)
        if (typeof bidSubscriptionId !== 'undefined') {
          connection.removeAccountChangeListener(bidSubscriptionId)
        }
        if (typeof askSubscriptionId !== 'undefined') {
          connection.removeAccountChangeListener(askSubscriptionId)
        }
      }
    }
  }, [bidAccountAddress, askAccountAddress, connection, useOrderbookFeed])

  useEffect(() => {
    const market = getMarket()
    if (!orderbookFeed.current || !market) return
    console.log(`[OrderbookFeed] subscribe ${market.publicKey.toBase58()}`)
    orderbookFeed.current.subscribe({
      marketId: market.publicKey.toBase58(),
    })
  }, [bidAccountAddress])

  const onGroupSizeChange = useCallback((groupSize: number) => {
    setGrouping(groupSize)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 items-center justify-between border-b border-th-bkg-3 px-4">
        {market ? (
          <>
            <p className="text-xs">{t('trade:grouping')}:</p>
            <div id="trade-step-four">
              <Tooltip
                className="hidden md:block"
                content={t('trade:grouping')}
                placement="left"
                delay={100}
              >
                <GroupSize
                  tickSize={market.tickSize}
                  onChange={onGroupSizeChange}
                  value={grouping}
                />
              </Tooltip>
            </div>
          </>
        ) : null}
      </div>
      <div className="grid grid-cols-2 px-2 py-0.5 text-xxs text-th-fgd-4">
        <div className="col-span-1">{t('price')}</div>
        <div className="col-span-1 text-right">{t('trade:size')}</div>
      </div>
      <div
        className="hide-scroll relative h-full overflow-y-scroll"
        ref={orderbookElRef}
        onScroll={handleScroll}
      >
        {depthArray.map((_x, idx) => {
          let index = idx
          if (orderbookData?.asks) {
            const lengthDiff = depthArray.length - orderbookData.asks.length
            if (lengthDiff > 0) {
              index = index < lengthDiff ? -1 : Math.abs(lengthDiff - index)
            }
          }
          return (
            <div className="h-[20px]" key={idx}>
              {!!orderbookData?.asks[index] && market ? (
                <MemoizedOrderbookRow
                  minOrderSize={market.minOrderSize}
                  tickSize={market.tickSize}
                  hasOpenOrder={orderbookData?.asks[index].isUsersOrder}
                  key={orderbookData?.asks[index].price}
                  price={orderbookData?.asks[index].price}
                  size={orderbookData?.asks[index].size}
                  side="sell"
                  sizePercent={orderbookData?.asks[index].sizePercent}
                  averagePrice={orderbookData?.asks[index].averagePrice}
                  cumulativeValue={orderbookData?.asks[index].cumulativeValue}
                  cumulativeSize={orderbookData?.asks[index].cumulativeSize}
                  cumulativeSizePercent={
                    orderbookData?.asks[index].cumulativeSizePercent
                  }
                  grouping={grouping}
                />
              ) : null}
            </div>
          )
        })}
        <div
          className="my-1 grid grid-cols-2 border-y border-th-bkg-3 px-4 py-1 text-xs text-th-fgd-4"
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
              ? orderbookData.spread < SHOW_EXPONENTIAL_THRESHOLD
                ? orderbookData.spread.toExponential()
                : formatNumericValue(
                    orderbookData.spread,
                    market ? getDecimalCount(market.tickSize) : undefined,
                  )
              : null}
          </div>
        </div>
        {depthArray.map((_x, index) => (
          <div className="h-[20px]" key={index}>
            {!!orderbookData?.bids[index] && market ? (
              <MemoizedOrderbookRow
                minOrderSize={market.minOrderSize}
                tickSize={market.tickSize}
                hasOpenOrder={orderbookData?.bids[index].isUsersOrder}
                price={orderbookData?.bids[index].price}
                size={orderbookData?.bids[index].size}
                side="buy"
                sizePercent={orderbookData?.bids[index].sizePercent}
                averagePrice={orderbookData?.bids[index].averagePrice}
                cumulativeValue={orderbookData?.bids[index].cumulativeValue}
                cumulativeSize={orderbookData?.bids[index].cumulativeSize}
                cumulativeSizePercent={
                  orderbookData?.bids[index].cumulativeSizePercent
                }
                grouping={grouping}
              />
            ) : null}
          </div>
        ))}
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
  averagePrice,
  cumulativeValue,
  cumulativeSize,
  cumulativeSizePercent,
  tickSize,
  grouping,
}: {
  side: 'buy' | 'sell'
  price: number
  size: number
  sizePercent: number
  averagePrice: number
  cumulativeValue: number
  cumulativeSize: number
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
    INITIAL_ANIMATION_SETTINGS,
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
      500,
    )
    return () => clearTimeout(id)
  }, [price, size])

  const formattedSize = useMemo(() => {
    return minOrderSize && !isNaN(size)
      ? floorToDecimal(size, getDecimalCount(minOrderSize))
      : new Decimal(size ?? -1)
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
      state.tradeForm.tradeType = 'Limit'
      if (state.tradeForm.baseSize) {
        const quoteSize = floorToDecimal(
          formattedPrice.mul(new Decimal(state.tradeForm.baseSize)),
          getDecimalCount(tickSize),
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
          getDecimalCount(tickSize),
        )
        state.tradeForm.quoteSize = quoteSize.toString()
      }
    })
  }, [formattedSize, tickSize])

  const groupingDecimalCount = useMemo(
    () => getDecimalCount(grouping),
    [grouping],
  )
  const minOrderSizeDecimals = useMemo(
    () => getDecimalCount(minOrderSize),
    [minOrderSize],
  )

  const handleMouseOver = useCallback(() => {
    const { set } = mangoStore.getState()
    if (averagePrice && cumulativeSize && cumulativeValue) {
      set((state) => {
        state.orderbookTooltip = {
          averagePrice,
          cumulativeSize,
          cumulativeValue,
          side,
        }
      })
    }
  }, [averagePrice, cumulativeSize, cumulativeValue])

  const handleMouseLeave = useCallback(() => {
    const { set } = mangoStore.getState()
    set((state) => {
      state.orderbookTooltip = undefined
    })
  }, [])

  if (!minOrderSize) return null

  return (
    <div
      className={`relative flex h-[20px] cursor-pointer justify-between border-b border-b-th-bkg-1 text-sm`}
      ref={element}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
    >
      <>
        <div className="flex h-full w-full items-center justify-between text-th-fgd-3 hover:bg-th-bkg-2">
          <div
            className={`z-10 flex h-full w-full items-center pl-2 hover:underline`}
            onClick={handlePriceClick}
          >
            <span className="w-full font-mono text-xs">
              {price < SHOW_EXPONENTIAL_THRESHOLD
                ? formattedPrice.toExponential()
                : formattedPrice.toFixed(groupingDecimalCount)}
            </span>
          </div>
          <div
            className="flex h-full w-full items-center justify-start pr-2 hover:underline"
            onClick={handleSizeClick}
          >
            <div
              style={{ fontFeatureSettings: 'zero 1' }}
              className={`z-10 w-full text-right font-mono text-xs ${
                hasOpenOrder ? 'text-th-active' : ''
              }`}
            >
              {size >= 1000000
                ? sizeCompacter.format(size)
                : formattedSize.toFixed(minOrderSizeDecimals)}
            </div>
          </div>
        </div>

        <Line
          className={`absolute left-0 opacity-30 brightness-125 ${
            side === 'buy' ? `bg-th-up-muted` : `bg-th-down-muted`
          }`}
          data-width={Math.max(sizePercent, 0.5) + '%'}
        />
        <Line
          className={`absolute left-0 opacity-40 ${
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
