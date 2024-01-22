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
import {
  BookSide,
  PerpMarket,
  Serum3Market,
} from '@blockworks-foundation/mango-v4'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import { OrderbookFeed } from '@blockworks-foundation/mango-feeds'
// import { breakpoints } from 'utils/theme'
import {
  decodeBook,
  decodeBookL2,
  formatOrderbookData,
  getMarket,
  updatePerpMarketOnGroup,
} from 'utils/orderbook'
import { OrderbookData, OrderbookL2 } from 'types'
import isEqual from 'lodash/isEqual'
import { useViewport } from 'hooks/useViewport'
import TokenLogo from '@components/shared/TokenLogo'
import MarketLogos from './MarketLogos'
import { OrderTypes } from 'utils/tradeForm'

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
  const [sizeInBase, setSizeInBase] = useState(true)
  // const [useOrderbookFeed, setUseOrderbookFeed] = useState(
  //   localStorage.getItem(USE_ORDERBOOK_FEED_KEY) !== null
  //     ? localStorage.getItem(USE_ORDERBOOK_FEED_KEY) === 'true'
  //     : true
  // )
  const { isDesktop } = useViewport()
  const [orderbookData, setOrderbookData] = useState<OrderbookData | null>(null)
  const currentOrderbookData = useRef<OrderbookL2>()

  const [baseBank, quoteBank] = useMemo(() => {
    const { group } = mangoStore.getState()
    if (!market || !group) return [undefined, undefined]
    if (market instanceof PerpMarket) {
      const quote = group.getFirstBankByTokenIndex(market.settleTokenIndex)
      return [undefined, quote]
    } else {
      const base = group.getFirstBankByMint(market.baseMintAddress)
      const quote = group.getFirstBankByMint(market.quoteMintAddress)
      return [base, quote]
    }
  }, [market])

  const depth = useMemo(() => {
    return isDesktop ? 30 : 12
  }, [isDesktop])

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

  // center orderbook on market change
  useEffect(() => {
    if (orderbookElRef?.current) {
      verticallyCenterOrderbook()
    }
  }, [orderbookElRef, market])

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
    return bidsPk?.toString() || ''
  }, [market])

  const askAccountAddress = useMemo(() => {
    if (!market) return ''
    const asksPk =
      market instanceof Market ? market['_decoded'].asks : market.asks
    return asksPk?.toString() || ''
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
            // updated orderbook data
            const updatedOrderbook = formatOrderbookData(
              newOrderbook?.bids,
              newOrderbook?.asks,
              depth,
              market,
              grouping,
              usersOpenOrderPrices(market),
            )
            currentOrderbookData.current = newOrderbook
            setOrderbookData(updatedOrderbook)
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
      const bidsPk = bidAccountAddress ? new PublicKey(bidAccountAddress) : null
      if (bidsPk) {
        connection
          .getAccountInfoAndContext(bidsPk)
          .then(({ context, value: info }) => {
            try {
              if (!info || !market) return
              const decodedBook = decodeBook(client, market, info, 'bids')
              set((state) => {
                state.selectedMarket.lastSeenSlot.bids = context.slot
                state.selectedMarket.bidsAccount = decodedBook
                state.selectedMarket.orderbook.bids = decodeBookL2(decodedBook)
              })
            } catch (e) {
              console.log(e)
              return
            }
          })
        bidSubscriptionId = connection.onAccountChange(
          bidsPk,
          (info, context) => {
            const lastSeenSlot =
              mangoStore.getState().selectedMarket.lastSeenSlot.bids
            if (context.slot > lastSeenSlot) {
              try {
                if (!market) return
                const decodedBook = decodeBook(client, market!, info, 'bids')
                if (decodedBook instanceof BookSide) {
                  updatePerpMarketOnGroup(decodedBook, 'bids')
                }
                set((state) => {
                  state.selectedMarket.bidsAccount = decodedBook
                  state.selectedMarket.orderbook.bids =
                    decodeBookL2(decodedBook)
                  state.selectedMarket.lastSeenSlot.bids = context.slot
                })
              } catch (e) {
                console.log(e)
                return
              }
            }
          },
          'processed',
        )
      }

      const asksPk = askAccountAddress ? new PublicKey(askAccountAddress) : null
      if (asksPk) {
        connection
          .getAccountInfoAndContext(asksPk)
          .then(({ context, value: info }) => {
            try {
              if (!info || !market) return
              const decodedBook = decodeBook(client, market, info, 'asks')
              set((state) => {
                state.selectedMarket.asksAccount = decodedBook
                state.selectedMarket.orderbook.asks = decodeBookL2(decodedBook)
                state.selectedMarket.lastSeenSlot.asks = context.slot
              })
            } catch (e) {
              console.log(e)
              return
            }
          })
        askSubscriptionId = connection.onAccountChange(
          asksPk,
          (info, context) => {
            const lastSeenSlot =
              mangoStore.getState().selectedMarket.lastSeenSlot.asks
            if (context.slot > lastSeenSlot) {
              try {
                if (!market) return
                const decodedBook = decodeBook(client, market!, info, 'asks')
                if (decodedBook instanceof BookSide) {
                  updatePerpMarketOnGroup(decodedBook, 'asks')
                }
                set((state) => {
                  state.selectedMarket.asksAccount = decodedBook
                  state.selectedMarket.orderbook.asks =
                    decodeBookL2(decodedBook)
                  state.selectedMarket.lastSeenSlot.asks = context.slot
                })
              } catch (e) {
                console.log(e)
                return
              }
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

  const onGroupSizeChange = useCallback(
    (groupSize: number) => {
      setGrouping(groupSize)
      if (market) {
        const updatedOrderbook = formatOrderbookData(
          currentOrderbookData?.current?.bids,
          currentOrderbookData?.current?.asks,
          depth,
          market,
          groupSize,
          usersOpenOrderPrices(market),
        )
        setOrderbookData(updatedOrderbook)
        verticallyCenterOrderbook()
      }
    },
    [currentOrderbookData, depth, market],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 items-center justify-between border-b border-th-bkg-3 px-4">
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
      <div className="grid grid-cols-2 px-2 pb-1 pt-1.5 text-xxs text-th-fgd-4">
        <div className="col-span-1">{t('price')}</div>
        <div className="col-span-1 flex items-center justify-end space-x-2">
          <span className="text-right">{t('trade:size')}</span>
          {quoteBank && market ? (
            <div className="flex h-[18px] space-x-1">
              <Tooltip
                content={t('trade:tooltip-size-base-quote', {
                  token:
                    market instanceof PerpMarket
                      ? market.name.split('-')[0]
                      : baseBank?.name,
                })}
              >
                <button
                  className={`rounded border p-0.5 ${
                    sizeInBase ? 'border-th-fgd-2' : 'border-th-bkg-4'
                  } focus:outline-none focus-visible:border-th-active md:hover:border-th-fgd-2`}
                  onClick={() => setSizeInBase(true)}
                >
                  {market instanceof PerpMarket ? (
                    <MarketLogos market={market} size="xs" />
                  ) : (
                    <TokenLogo bank={baseBank} size={12} />
                  )}
                </button>
              </Tooltip>
              <Tooltip
                content={t('trade:tooltip-size-base-quote', {
                  token: quoteBank.name,
                })}
              >
                <button
                  className={`rounded border p-0.5 ${
                    !sizeInBase ? 'border-th-fgd-2' : 'border-th-bkg-4'
                  } focus:outline-none focus-visible:border-th-active md:hover:border-th-fgd-2`}
                  onClick={() => setSizeInBase(false)}
                >
                  <TokenLogo bank={quoteBank} size={12} />
                </button>
              </Tooltip>
            </div>
          ) : null}
        </div>
      </div>
      <div
        className="hide-scroll relative h-full overflow-y-scroll"
        ref={orderbookElRef}
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
                  sizeInBase={sizeInBase}
                />
              ) : null}
            </div>
          )
        })}
        <div
          className="my-1 grid grid-cols-3 bg-th-bkg-2 px-4 py-1 text-xs text-th-fgd-4"
          id="trade-step-nine"
        >
          <div className="col-span-1">
            <p className="text-xxs">{t('trade:spread')}</p>
          </div>
          <div className="col-span-1 text-center font-mono">
            <span className="text-th-fgd-3">
              {orderbookData?.spreadPercentage.toFixed(2)}%
            </span>
          </div>
          <div className="col-span-1 text-right font-mono">
            <span className="text-th-fgd-3">
              {orderbookData?.spread
                ? orderbookData.spread < SHOW_EXPONENTIAL_THRESHOLD
                  ? orderbookData.spread.toExponential()
                  : formatNumericValue(
                      orderbookData.spread,
                      market ? getDecimalCount(market.tickSize) : undefined,
                    )
                : null}
            </span>
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
                sizeInBase={sizeInBase}
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
  sizeInBase,
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
  sizeInBase: boolean
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

  const minOrderSizeDecimals = useMemo(
    () => getDecimalCount(minOrderSize),
    [minOrderSize],
  )

  const tickSizeDecimals = useMemo(() => getDecimalCount(tickSize), [tickSize])

  const formattedSize = useMemo(() => {
    if (!minOrderSize || isNaN(size)) return new Decimal(size ?? -1)
    const sizeToShow = sizeInBase
      ? size
      : new Decimal(size).mul(new Decimal(price)).toNumber()
    const decimals = sizeInBase ? minOrderSizeDecimals : tickSizeDecimals
    return floorToDecimal(sizeToShow, decimals)
  }, [minOrderSizeDecimals, price, size, sizeInBase, tickSizeDecimals])

  const formattedPrice = useMemo(() => {
    return tickSizeDecimals && !isNaN(price)
      ? floorToDecimal(price, tickSizeDecimals)
      : new Decimal(price)
  }, [price, tickSizeDecimals])

  const handlePriceClick = useCallback(() => {
    const set = mangoStore.getState().set
    set((state) => {
      state.tradeForm.price = formattedPrice.toFixed()
      state.tradeForm.tradeType = OrderTypes.LIMIT
      if (state.tradeForm.baseSize) {
        const quoteSize = floorToDecimal(
          formattedPrice.mul(new Decimal(state.tradeForm.baseSize)),
          tickSizeDecimals,
        )
        state.tradeForm.quoteSize = quoteSize.toFixed()
      }
    })
  }, [formattedPrice, tickSizeDecimals])

  const handleSizeClick = useCallback(() => {
    const set = mangoStore.getState().set
    set((state) => {
      if (sizeInBase) {
        state.tradeForm.baseSize = formattedSize.toString()
      } else {
        state.tradeForm.quoteSize = formattedSize.toString()
      }
      if (formattedSize && state.tradeForm.price) {
        if (sizeInBase) {
          const quoteSize = floorToDecimal(
            formattedSize.mul(new Decimal(state.tradeForm.price)),
            tickSizeDecimals,
          )
          state.tradeForm.quoteSize = quoteSize.toString()
        } else {
          const baseSize = floorToDecimal(
            formattedSize.div(new Decimal(state.tradeForm.price)),
            minOrderSizeDecimals,
          )
          state.tradeForm.baseSize = baseSize.toString()
        }
      }
    })
  }, [formattedSize, minOrderSizeDecimals, size, sizeInBase, tickSizeDecimals])

  const groupingDecimalCount = useMemo(
    () => getDecimalCount(grouping),
    [grouping],
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
              {formattedPrice.lt(SHOW_EXPONENTIAL_THRESHOLD)
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
              {formattedSize.toNumber() >= 1000000
                ? sizeCompacter.format(formattedSize.toNumber())
                : formattedSize.toNumber()}
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

function usersOpenOrderPrices(market: Market | PerpMarket | null) {
  if (!market) return []
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
  return usersOpenOrderPrices
}
