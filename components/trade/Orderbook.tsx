import { AccountInfo } from '@solana/web3.js'
import Big from 'big.js'
import mangoStore from '@store/mangoStore'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Market, Orderbook as SpotOrderBook } from '@project-serum/serum'
import useInterval from '@components/shared/useInterval'
import isEqual from 'lodash/isEqual'
import usePrevious from '@components/shared/usePrevious'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { floorToDecimal, formatDecimal, getDecimalCount } from 'utils/numbers'
import { ORDERBOOK_FLASH_KEY } from 'utils/constants'
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

function decodeBookL2(
  client: MangoClient,
  market: Market | PerpMarket,
  accInfo: AccountInfo<Buffer>,
  side: 'bids' | 'asks'
): number[][] {
  if (market && accInfo?.data) {
    const depth = 40
    if (market instanceof Market) {
      const book = SpotOrderBook.decode(market, accInfo.data)
      return book.getL2(depth).map(([price, size]) => [price, size])
    } else if (market instanceof PerpMarket) {
      // FIXME: Review the null being passed here
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
      return book.getL2Ui(depth)
    }
  }
  return []
}

// export function decodeBook(
//   market: Market,
//   accInfo: AccountInfo<Buffer>
// ): SpotOrderBook | undefined {
//   if (market && accInfo?.data) {
//     if (market instanceof Market) {
//       return SpotOrderBook.decode(market, accInfo.data)
//     }
//     else if (market instanceof PerpMarket) {
//       // FIXME: Review the null being passed here
//       return new BookSide(
//         // @ts-ignore
//         null,
//         market,
//         BookSideLayout.decode(accInfo.data),
//         undefined,
//         100000
//       )
//     }
//   }
// }

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
  let cumulative = orders
    .slice(0, depth)
    .reduce((cumulative, [price, size], i) => {
      const cumulativeSize = (cumulative[i - 1]?.cumulativeSize || 0) + size
      cumulative.push({
        price,
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

const depth = 40

const Orderbook = () => {
  const { t } = useTranslation(['common', 'trade'])
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)

  // const [openOrderPrices, setOpenOrderPrices] = useState<any[]>([])
  const [isScrolled, setIsScrolled] = useState(false)
  const [orderbookData, setOrderbookData] = useState<any | null>(null)
  const [grouping, setGrouping] = useState(0.01)
  const [showBuys, setShowBuys] = useState(true)
  const [showSells, setShowSells] = useState(true)

  const currentOrderbookData = useRef<any>(null)
  const nextOrderbookData = useRef<any>(null)
  const orderbookElRef = useRef<HTMLDivElement>(null)
  const previousGrouping = usePrevious(grouping)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  const depthArray = useMemo(() => {
    const bookDepth = !isMobile ? depth : 7
    return Array(bookDepth).fill(0)
  }, [isMobile])

  const market = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return

    if (selectedMarket instanceof Serum3Market) {
      return group?.getSerum3ExternalMarket(selectedMarket.serumMarketExternal)
    } else {
      return selectedMarket
    }
  }, [selectedMarket])

  useEffect(() => {
    if (!market) return
    setGrouping(market.tickSize)
  }, [market])

  useEffect(
    () =>
      mangoStore.subscribe(
        (state) => [state.selectedMarket.orderbook],
        (orderbook) => (nextOrderbookData.current = orderbook)
      ),
    []
  )

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

  useInterval(() => {
    const orderbook = mangoStore.getState().selectedMarket.orderbook
    const group = mangoStore.getState().group
    if (!market || !group) return

    if (
      nextOrderbookData?.current &&
      (!isEqual(currentOrderbookData.current, nextOrderbookData.current) ||
        previousGrouping !== grouping)
    ) {
      // check if user has open orders so we can highlight them on orderbook
      // const openOrders = mangoStore.getState().mangoAccount.openOrders
      // const newOpenOrderPrices = openOrders?.length
      //   ? openOrders
      //       .filter(({ market }) =>
      //         market.account.publicKey.equals(marketConfig.publicKey)
      //       )
      //       .map(({ order }) => order.price)
      //   : []
      // if (!isEqual(newOpenOrderPrices, openOrderPrices)) {
      //   setOpenOrderPrices(newOpenOrderPrices)
      // }

      // updated orderbook data
      const bids = groupBy(orderbook?.bids, market!, grouping, true) || []
      const asks = groupBy(orderbook?.asks, market!, grouping, false) || []

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

      currentOrderbookData.current = {
        bids: orderbook?.bids,
        asks: orderbook?.asks,
      }
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
  }, 400)

  useEffect(() => {
    const connection = mangoStore.getState().connection
    const group = mangoStore.getState().group
    const set = mangoStore.getState().set
    const client = mangoStore.getState().client

    let previousBidInfo: AccountInfo<Buffer> | null = null
    let previousAskInfo: AccountInfo<Buffer> | null = null
    if (!market || !group) return
    console.log('in orderbook WS useEffect')
    const bidsPk =
      market instanceof Market ? market['_decoded'].bids : market.bids
    connection.getAccountInfo(bidsPk).then((info) => {
      if (!info) return
      set((state) => {
        // state.accountInfos[bidsPk.toString()] = info
        state.selectedMarket.orderbook.bids = decodeBookL2(
          client,
          market,
          info,
          'bids'
        )
      })
    })
    const bidSubscriptionId = connection.onAccountChange(
      bidsPk,
      (info, context) => {
        if (
          !previousBidInfo ||
          !previousBidInfo.data.equals(info.data) ||
          previousBidInfo.lamports !== info.lamports
        ) {
          previousBidInfo = info
          // info['parsed'] = decodeBook(serum3MarketExternal, info)
          set((state) => {
            // state.accountInfos[bidsPk.toString()] = info
            state.selectedMarket.orderbook.bids = decodeBookL2(
              client,
              market,
              info,
              'bids'
            )
          })
        }
      }
    )
    const asksPk =
      market instanceof Market ? market['_decoded'].asks : market.asks
    connection.getAccountInfo(asksPk).then((info) => {
      if (!info) return
      set((state) => {
        // state.accountInfos[bidsPk.toString()] = info
        state.selectedMarket.orderbook.asks = decodeBookL2(
          client,
          market,
          info,
          'bids'
        )
      })
    })
    const askSubscriptionId = connection.onAccountChange(
      asksPk,
      (info, context) => {
        if (
          !previousAskInfo ||
          !previousAskInfo.data.equals(info.data) ||
          previousAskInfo.lamports !== info.lamports
        ) {
          previousAskInfo = info
          // info['parsed'] = decodeBook(serum3MarketExternal, info)
          set((state) => {
            // state.accountInfos[asksPk.toString()] = info
            state.selectedMarket.orderbook.asks = decodeBookL2(
              client,
              market,
              info,
              'asks'
            )
          })
        }
      }
    )
    return () => {
      connection.removeAccountChangeListener(bidSubscriptionId)
      connection.removeAccountChangeListener(askSubscriptionId)
    }
  }, [market])

  useEffect(() => {
    window.addEventListener('resize', verticallyCenterOrderbook)
    // const id = setTimeout(verticallyCenterOrderbook, 400)
    // return () => clearTimeout(id)
  }, [verticallyCenterOrderbook])

  const onGroupSizeChange = useCallback((groupSize: number) => {
    setGrouping(groupSize)
  }, [])

  const handleScroll = useCallback(() => {
    setIsScrolled(true)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-th-bkg-3 px-4 py-2">
        <div id="trade-step-three" className="flex items-center space-x-2">
          <Tooltip
            content={showBuys ? t('trade:hide-bids') : t('trade:show-bids')}
            placement="top"
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
            content={showSells ? t('trade:hide-asks') : t('trade:show-asks')}
            placement="top"
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
        </div>
        {market ? (
          <div id="trade-step-four">
            <Tooltip content={t('trade:grouping')} placement="top" delay={250}>
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
        <div className="col-span-1 text-right">{t('trade:size')}</div>
        <div className="col-span-1 text-right">{t('price')}</div>
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
                      // hasOpenOrder={hasOpenOrderForPriceGroup(
                      //   openOrderPrices,
                      //   price,
                      //   grouping
                      // )}
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
              {orderbookData?.spread.toFixed(2)}
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
                    // hasOpenOrder={hasOpenOrderForPriceGroup(
                    //   openOrderPrices,
                    //   price,
                    //   grouping
                    // )}
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
  // hasOpenOrder,
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
  // hasOpenOrder: boolean
  // invert: boolean
  grouping: number
  minOrderSize: number
  tickSize: number
}) => {
  const element = useRef<HTMLDivElement>(null)
  // const set = mangoStore.getState().set
  const [showOrderbookFlash] = useLocalStorageState(ORDERBOOK_FLASH_KEY, true)
  const flashClassName = side === 'sell' ? 'red-flash' : 'green-flash'

  useEffect(() => {
    showOrderbookFlash &&
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
    })
  }, [formattedPrice])

  // const handleSizeClick = () => {
  //   set((state) => {
  //     state.tradeForm.baseSize = Number(formattedSize)
  //   })
  // }

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
      onClick={handlePriceClick}
    >
      <>
        <div className="flex w-full items-center justify-between text-th-fgd-3 hover:bg-th-bkg-2">
          <div className="flex w-full justify-start pl-2">
            <div
              style={{ fontFeatureSettings: 'zero 1' }}
              className={`z-10 w-full text-right font-mono text-xs ${
                /*hasOpenOrder*/ false ? 'text-th-primary' : ''
              }`}
              // onClick={handleSizeClick}
            >
              {formattedSize.toFixed(minOrderSizeDecimals)}
            </div>
          </div>
          <div className={`z-10 w-full pr-4 text-right font-mono text-xs`}>
            {formattedPrice.toFixed(groupingDecimalCount)}
          </div>
        </div>

        <Line
          className={`absolute left-0 opacity-40 brightness-125 ${
            side === 'buy' ? `bg-th-green-muted` : `bg-th-red-muted`
          }`}
          data-width={Math.max(sizePercent, 0.5) + '%'}
        />
        <Line
          className={`absolute left-0 opacity-70 ${
            side === 'buy' ? `bg-th-green` : `bg-th-red`
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

const Line = (props: any) => {
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
