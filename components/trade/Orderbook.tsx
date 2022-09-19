import { AccountInfo } from '@solana/web3.js'
import Big from 'big.js'
import mangoStore from '@store/mangoStore'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Market, Orderbook as SpotOrderBook } from '@project-serum/serum'
import useInterval from '@components/shared/useInterval'
import isEqualLodash from 'lodash/isEqual'
import usePrevious from '@components/shared/usePrevious'
import { PerpMarket } from '@blockworks-foundation/mango-v4/dist/types/src/accounts/perp'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { floorToDecimal, formatDecimal, getDecimalCount } from 'utils/numbers'
import { ORDERBOOK_FLASH_KEY } from 'utils/constants'
import { useTranslation } from 'next-i18next'
import Decimal from 'decimal.js'
import OrderbookIcon from '@components/icons/OrderbookIcon'
import Tooltip from '@components/shared/Tooltip'
import GroupSize from './GroupSize'

function decodeBookL2(
  market: Market,
  accInfo: AccountInfo<Buffer>
): number[][] {
  if (market && accInfo?.data) {
    const depth = 40
    if (market instanceof Market) {
      const book = SpotOrderBook.decode(market, accInfo.data)
      return book.getL2(depth).map(([price, size]) => [price, size])
    }
    // else if (market instanceof PerpMarket) {
    //   // FIXME: Review the null being passed here
    //   const book = new BookSide(
    //     // @ts-ignore
    //     null,
    //     market,
    //     BookSideLayout.decode(accInfo.data),
    //     undefined,
    //     100000
    //   )
    //   return book.getL2Ui(depth)
    // }
  }
  return []
}

export function decodeBook(
  market: Market,
  accInfo: AccountInfo<Buffer>
): SpotOrderBook | undefined {
  if (market && accInfo?.data) {
    if (market instanceof Market) {
      return SpotOrderBook.decode(market, accInfo.data)
    }
    // else if (market instanceof PerpMarket) {
    //   // FIXME: Review the null being passed here
    //   return new BookSide(
    //     // @ts-ignore
    //     null,
    //     market,
    //     BookSideLayout.decode(accInfo.data),
    //     undefined,
    //     100000
    //   )
    // }
  }
}

type cumOrderbookSide = {
  price: number
  size: number
  cumulativeSize: number
  sizePercent: number
  maxSizePercent: number
}

const getCumulativeOrderbookSide = (
  orders: any[],
  totalSize: number,
  maxSize: number,
  depth: number,
  backwards = false
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
        maxSizePercent: Math.round((size / (maxSize || 1)) * 100),
      })
      return cumulative
    }, [])
  if (backwards) {
    cumulative = cumulative.reverse()
  }
  return cumulative
}

const groupBy = (
  ordersArray: number[][],
  market: Market,
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

const Orderbook = ({ depth = 12 }) => {
  const { t } = useTranslation('common')
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)

  const [openOrderPrices, setOpenOrderPrices] = useState<any[]>([])
  const [orderbookData, setOrderbookData] = useState<any | null>(null)
  const [defaultLayout, setDefaultLayout] = useState(true)
  const [displayCumulativeSize, setDisplayCumulativeSize] = useState(false)
  const [grouping, setGrouping] = useState(0.01)
  const [showBuys, setShowBuys] = useState(true)
  const [showSells, setShowSells] = useState(true)

  const currentOrderbookData = useRef<any>(null)
  const nextOrderbookData = useRef<any>(null)
  const previousDepth = usePrevious(depth)
  const previousGrouping = usePrevious(grouping)

  const serum3MarketExternal = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return
    return group.serum3MarketExternalsMap.get(
      selectedMarket.serumMarketExternal.toBase58()
    )
  }, [selectedMarket])

  useEffect(() => {
    if (serum3MarketExternal) {
      setGrouping(serum3MarketExternal.tickSize)
    }
  }, [serum3MarketExternal])

  useEffect(
    () =>
      mangoStore.subscribe(
        (state) => [state.selectedMarket.orderbook],
        (orderbook) => (nextOrderbookData.current = orderbook)
      ),
    []
  )

  useInterval(() => {
    const orderbook = mangoStore.getState().selectedMarket.orderbook
    const group = mangoStore.getState().group
    if (!selectedMarket || !group) return
    const serum3MarketExternal = group.serum3MarketExternalsMap.get(
      selectedMarket.serumMarketExternal.toBase58()
    )
    if (
      nextOrderbookData?.current &&
      (!isEqualLodash(
        currentOrderbookData.current,
        nextOrderbookData.current
      ) ||
        previousDepth !== depth ||
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
      // if (!isEqualLodash(newOpenOrderPrices, openOrderPrices)) {
      //   setOpenOrderPrices(newOpenOrderPrices)
      // }

      // updated orderbook data
      const bids =
        groupBy(orderbook?.bids, serum3MarketExternal!, grouping, true) || []
      const asks =
        groupBy(orderbook?.asks, serum3MarketExternal!, grouping, false) || []

      const sum = (total: number, [, size]: number[], index: number) =>
        index < depth ? total + size : total
      const totalSize = bids.reduce(sum, 0) + asks.reduce(sum, 0)
      const maxSize =
        Math.max(
          ...asks.map((a: number[]) => {
            return a[1]
          })
        ) +
        Math.max(
          ...bids.map((b: number[]) => {
            return b[1]
          })
        )

      const bidsToDisplay = defaultLayout
        ? getCumulativeOrderbookSide(bids, totalSize, maxSize, depth, false)
        : getCumulativeOrderbookSide(bids, totalSize, maxSize, depth / 2, false)
      const asksToDisplay = defaultLayout
        ? getCumulativeOrderbookSide(asks, totalSize, maxSize, depth, false)
        : getCumulativeOrderbookSide(
            asks,
            totalSize,
            maxSize,
            (depth + 1) / 2,
            true
          )

      currentOrderbookData.current = {
        bids: orderbook?.bids,
        asks: orderbook?.asks,
      }
      if (bidsToDisplay[0] || asksToDisplay[0]) {
        const bid = bidsToDisplay[0]?.price
        const ask = defaultLayout
          ? asksToDisplay[0]?.price
          : asksToDisplay[asksToDisplay.length - 1]?.price
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
      } else {
        setOrderbookData(null)
      }
    }
  }, 400)

  useEffect(() => {
    const connection = mangoStore.getState().connection
    const group = mangoStore.getState().group
    const set = mangoStore.getState().set

    let previousBidInfo: AccountInfo<Buffer> | null = null
    let previousAskInfo: AccountInfo<Buffer> | null = null
    if (!serum3MarketExternal || !group) return
    console.log('in orderbook WS useEffect')

    const bidsPk = serum3MarketExternal['_decoded'].bids
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
              serum3MarketExternal,
              info
            )
          })
        }
      }
    )
    const asksPk = serum3MarketExternal['_decoded'].asks
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
              serum3MarketExternal,
              info
            )
          })
        }
      }
    )
    return () => {
      connection.removeAccountChangeListener(bidSubscriptionId)
      connection.removeAccountChangeListener(askSubscriptionId)
    }
  }, [serum3MarketExternal])

  const onGroupSizeChange = (groupSize: number) => {
    setGrouping(groupSize)
  }

  if (!serum3MarketExternal) return null

  return (
    <div className="hide-scroll h-full overflow-y-scroll">
      <div className="sticky top-0 z-20 flex h-[49px] items-center border-b border-th-bkg-3 bg-th-bkg-1 px-4">
        <h2 className="text-sm text-th-fgd-3">Orderbook</h2>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <Tooltip
            content={showBuys ? 'Hide Buys' : 'Show Buys'}
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
            content={showSells ? 'Hide Sells' : 'Show Sells'}
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
        <Tooltip content="Grouping" placement="top">
          <GroupSize
            tickSize={serum3MarketExternal.tickSize}
            onChange={onGroupSizeChange}
            value={grouping}
          />
        </Tooltip>
      </div>
      <div className="grid grid-cols-2 px-4 pb-2 text-xs text-th-fgd-4">
        <div className="col-span-1 text-right">Size</div>
        <div className="col-span-1 text-right">Price</div>
      </div>
      <div className="">
        {showSells
          ? orderbookData?.asks.map(
              ({
                price,
                size,
                cumulativeSize,
                sizePercent,
                maxSizePercent,
              }: cumOrderbookSide) => (
                <OrderbookRow
                  market={serum3MarketExternal}
                  // hasOpenOrder={hasOpenOrderForPriceGroup(
                  //   openOrderPrices,
                  //   price,
                  //   grouping
                  // )}
                  key={price + ''}
                  price={price}
                  size={displayCumulativeSize ? cumulativeSize : size}
                  side="sell"
                  sizePercent={
                    displayCumulativeSize ? maxSizePercent : sizePercent
                  }
                  grouping={grouping}
                />
              )
            )
          : null}
        {showBuys && showSells ? (
          <div className="my-2 grid grid-cols-2 border-y border-th-bkg-3 py-2 px-4 text-xs">
            <div className="col-span-1 flex justify-between">
              <div className="text-th-fgd-3">{t('spread')}</div>
              <div className="text-th-fgd-1">
                {orderbookData?.spread.toFixed(2)}
              </div>
            </div>
            <div className="col-span-1 text-right text-th-fgd-1">
              {orderbookData?.spreadPercentage.toFixed(2)}%
            </div>
          </div>
        ) : null}
        {showBuys
          ? orderbookData?.bids.map(
              ({
                price,
                size,
                cumulativeSize,
                sizePercent,
                maxSizePercent,
              }: cumOrderbookSide) => (
                <OrderbookRow
                  market={serum3MarketExternal}
                  // hasOpenOrder={hasOpenOrderForPriceGroup(
                  //   openOrderPrices,
                  //   price,
                  //   grouping
                  // )}
                  key={price + ''}
                  price={price}
                  size={displayCumulativeSize ? cumulativeSize : size}
                  side="buy"
                  sizePercent={
                    displayCumulativeSize ? maxSizePercent : sizePercent
                  }
                  grouping={grouping}
                />
              )
            )
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
  market,
  grouping,
}: {
  side: 'buy' | 'sell'
  price: number
  size: number
  sizePercent: number
  // hasOpenOrder: boolean
  // invert: boolean
  grouping: number
  market: Market
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
      250
    )
    return () => clearTimeout(id)
  }, [price, size])

  const formattedSize =
    market!.minOrderSize && !isNaN(size)
      ? floorToDecimal(size, getDecimalCount(market.minOrderSize))
      : new Decimal(size)

  const formattedPrice =
    market!.tickSize && !isNaN(price)
      ? floorToDecimal(price, getDecimalCount(market.tickSize))
      : new Decimal(price)

  // const handlePriceClick = () => {
  //   set((state) => {
  //     state.tradeForm.price = Number(formattedPrice)
  //   })
  // }

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
    () => getDecimalCount(market.minOrderSize),
    [market.minOrderSize]
  )

  if (!market) return null

  return (
    <div
      className={`relative flex cursor-pointer justify-between border-b border-b-th-bkg-1 text-sm`}
      ref={element}
    >
      <>
        <div className="flex w-full items-center justify-between hover:bg-th-bkg-2">
          <div className="flex w-full justify-start pl-2">
            <div
              style={{ fontFeatureSettings: 'zero 1' }}
              className={`z-10 w-full text-right font-mono text-xs leading-5 md:leading-6 ${
                /*hasOpenOrder*/ false ? 'text-th-primary' : ''
              }`}
              // onClick={handleSizeClick}
            >
              {formattedSize.toFixed(minOrderSizeDecimals)}
            </div>
          </div>
          <div
            className={`z-10 w-full pr-4 text-right font-mono text-xs leading-5 md:leading-6`}
            // onClick={handlePriceClick}
          >
            {formattedPrice.toFixed(groupingDecimalCount)}
          </div>
        </div>

        <Line
          className={`absolute left-0 opacity-90 ${
            side === 'buy' ? `bg-th-green-muted` : `bg-th-red-muted`
          }`}
          data-width={sizePercent + '%'}
        />
      </>
    </div>
  )
}

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
