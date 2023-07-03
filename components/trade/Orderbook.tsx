import { AccountInfo, PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Market, Orderbook as SpotOrderBook } from '@project-serum/serum'
import useLocalStorageState from 'hooks/useLocalStorageState'
import {
  floorToDecimal,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import { ANIMATION_SETTINGS_KEY, USE_ORDERBOOK_FEED_KEY } from 'utils/constants'
import { useTranslation } from 'next-i18next'
import Decimal from 'decimal.js'
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
  Serum3Market,
} from '@blockworks-foundation/mango-v4'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import { ArrowPathIcon } from '@heroicons/react/20/solid'
import { sleep } from 'utils'
import { OrderbookFeed } from '@blockworks-foundation/mango-feeds'
import useOrderbookSubscription from 'hooks/useOrderbookSubscription'

const sizeCompacter = Intl.NumberFormat('en', {
  maximumFractionDigits: 6,
  notation: 'compact',
})

const SHOW_EXPONENTIAL_THRESHOLD = 0.00001

const getMarket = () => {
  const group = mangoStore.getState().group
  const selectedMarket = mangoStore.getState().selectedMarket.current
  if (!group || !selectedMarket) return
  return selectedMarket instanceof PerpMarket
    ? selectedMarket
    : group?.getSerum3ExternalMarket(selectedMarket.serumMarketExternal)
}

export const decodeBookL2 = (book: SpotOrderBook | BookSide): number[][] => {
  const depth = 300
  if (book instanceof SpotOrderBook) {
    return book.getL2(depth).map(([price, size]) => [price, size])
  } else if (book instanceof BookSide) {
    return book.getL2Ui(depth)
  }
  return []
}

export function decodeBook(
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

const updatePerpMarketOnGroup = (book: BookSide, side: 'bids' | 'asks') => {
  const group = mangoStore.getState().group
  const perpMarket = group?.getPerpMarketByMarketIndex(
    book.perpMarket.perpMarketIndex
  )
  if (perpMarket) {
    perpMarket[`_${side}`] = book
    // mangoStore.getState().actions.fetchOpenOrders()
  }
}

const Orderbook = ({
  grouping,
  setGrouping,
}: {
  grouping: number
  setGrouping: (g: number) => void
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const {
    serumOrPerpMarket: market,
    baseSymbol,
    quoteSymbol,
  } = useSelectedMarket()
  const connection = mangoStore((s) => s.connection)

  const [isScrolled, setIsScrolled] = useState(false)
  const [tickSize, setTickSize] = useState(0)
  const [showBids, setShowBids] = useState(true)
  const [showAsks, setShowAsks] = useState(true)
  const [useOrderbookFeed, setUseOrderbookFeed] = useState(
    localStorage.getItem(USE_ORDERBOOK_FEED_KEY) !== null
      ? localStorage.getItem(USE_ORDERBOOK_FEED_KEY) === 'true'
      : true
  )

  const orderbookElRef = useRef<HTMLDivElement>(null)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  const depth = useMemo(() => {
    return isMobile ? 9 : 40
  }, [isMobile])

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

  const orderbookData = useOrderbookSubscription(
    depth,
    grouping,
    isScrolled,
    verticallyCenterOrderbook
  )

  const depthArray: number[] = useMemo(() => {
    return Array(depth).fill(0)
  }, [depth])

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
          }
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
            (level) => level && level.length && level[0] === diff[0]
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
          `[OrderbookFeed] unsubscribe ${market.publicKey.toBase58()}`
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
          'processed'
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
          'processed'
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

  useEffect(() => {
    window.addEventListener('resize', verticallyCenterOrderbook)
  }, [verticallyCenterOrderbook])

  const resetOrderbook = useCallback(async () => {
    setShowBids(true)
    setShowAsks(true)
    await sleep(300)
    verticallyCenterOrderbook()
  }, [verticallyCenterOrderbook])

  const onGroupSizeChange = useCallback((groupSize: number) => {
    setGrouping(groupSize)
  }, [])

  const handleScroll = useCallback(() => {
    setIsScrolled(true)
  }, [])

  const toggleSides = (side: string) => {
    if (side === 'bids') {
      setShowBids(true)
      setShowAsks(false)
    } else {
      setShowBids(false)
      setShowAsks(true)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-th-bkg-3 px-4 py-2">
        <div
          id="trade-step-three"
          className="hidden items-center space-x-1.5 md:flex"
        >
          <Tooltip
            className={`${!showAsks ? 'hidden' : ''}`}
            content={t('trade:show-bids')}
            placement="bottom"
          >
            <button
              className={`rounded ${
                showAsks ? 'bg-th-bkg-3' : 'bg-th-bkg-2'
              } flex h-6 w-6 items-center justify-center hover:border-th-fgd-4 focus:outline-none focus-visible:bg-th-bkg-4 disabled:cursor-not-allowed`}
              onClick={() => toggleSides('bids')}
            >
              <OrderbookIcon className="h-4 w-4" side="buy" />
            </button>
          </Tooltip>
          <Tooltip
            className={`${!showBids ? 'hidden' : ''}`}
            content={t('trade:show-asks')}
            placement="bottom"
          >
            <button
              className={`rounded ${
                showBids ? 'bg-th-bkg-3' : 'bg-th-bkg-2'
              } flex h-6 w-6 items-center justify-center hover:border-th-fgd-4 focus:outline-none focus-visible:bg-th-bkg-4 disabled:cursor-not-allowed`}
              onClick={() => toggleSides('asks')}
            >
              <OrderbookIcon className="h-4 w-4" side="sell" />
            </button>
          </Tooltip>
          <Tooltip content={'Reset and center orderbook'} placement="bottom">
            <button
              className="flex h-6 w-6 items-center justify-center rounded bg-th-bkg-3 hover:border-th-fgd-4 focus:outline-none focus-visible:bg-th-bkg-4 disabled:cursor-not-allowed"
              onClick={resetOrderbook}
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
        {market ? (
          <>
            <p className="text-xs md:hidden">{t('trade:grouping')}:</p>
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
        {showAsks
          ? depthArray.map((_x, idx) => {
              let index = idx
              const reverse = showAsks && !showBids
              if (orderbookData?.asks && !reverse) {
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
                      hasOpenOrder={orderbookData?.asks[index].isUsersOrder}
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
        {showBids && showAsks ? (
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
                ? orderbookData.spread < SHOW_EXPONENTIAL_THRESHOLD
                  ? orderbookData.spread.toExponential()
                  : formatNumericValue(
                      orderbookData.spread,
                      market ? getDecimalCount(market.tickSize) : undefined
                    )
                : null}
            </div>
          </div>
        ) : null}
        {showBids
          ? depthArray.map((_x, index) => (
              <div className="h-[24px]" key={index}>
                {!!orderbookData?.bids[index] && market ? (
                  <MemoizedOrderbookRow
                    minOrderSize={market.minOrderSize}
                    tickSize={market.tickSize}
                    hasOpenOrder={orderbookData?.bids[index].isUsersOrder}
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
            >
              {size >= 1000000
                ? sizeCompacter.format(size)
                : formattedSize.toFixed(minOrderSizeDecimals)}
            </div>
          </div>
          <div
            className={`z-10 flex h-full w-full items-center pr-4 hover:underline`}
            onClick={handlePriceClick}
          >
            <div className="w-full text-right font-mono text-xs">
              {price < SHOW_EXPONENTIAL_THRESHOLD
                ? formattedPrice.toExponential()
                : formattedPrice.toFixed(groupingDecimalCount)}
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
