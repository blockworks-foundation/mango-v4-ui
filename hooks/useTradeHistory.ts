import {
  Group,
  PerpMarket,
  Serum3Market,
} from '@blockworks-foundation/mango-v4'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  CombinedTradeHistoryTypes,
  EmptyObject,
  isApiSpotTradeHistory,
  isPerpFillEvent,
  isSerumFillEvent,
  PerpFillEvent,
  PerpTradeHistory,
  SerumEvent,
  SpotTradeHistory,
  TradeHistoryApiResponseType,
} from 'types'
import { MANGO_DATA_API_URL, PAGINATION_PAGE_LENGTH } from 'utils/constants'
import useMangoAccount from './useMangoAccount'
import useSelectedMarket from './useSelectedMarket'

const parsePerpEvent = (mangoAccountAddress: string, event: PerpFillEvent) => {
  const maker = event.maker.toString() === mangoAccountAddress
  const orderId = maker ? event.makerOrderId : event.takerOrderId
  const value = event.quantity * event.price
  const feeRate = maker ? event.makerFee : event.takerFee
  const takerSide = event.takerSide === 0 ? 'buy' : 'sell'
  const side = maker ? (takerSide === 'buy' ? 'sell' : 'buy') : takerSide

  return {
    ...event,
    key: orderId?.toString(),
    liquidity: maker ? 'Maker' : 'Taker',
    size: event.quantity,
    price: event.price,
    value,
    feeCost: feeRate * value,
    side,
  }
}

const parseSerumEvent = (event: SerumEvent) => {
  let liquidity
  if (event.eventFlags) {
    liquidity = event?.eventFlags?.maker ? 'Maker' : 'Taker'
  }

  return {
    ...event,
    liquidity,
    key: `${liquidity}-${event.price}`,
    value: event.price * event.size,
    side: event.side,
  }
}

export const parseApiTradeHistory = (
  mangoAccountAddress: string,
  trade: SpotTradeHistory | PerpTradeHistory,
) => {
  let side: 'buy' | 'sell'
  let size
  let feeCost
  let liquidity
  if (isApiSpotTradeHistory(trade)) {
    side = trade.side
    size = trade.size
    feeCost = trade.fee_cost
    liquidity = trade.maker ? 'Maker' : 'Taker'
  } else {
    liquidity =
      trade.taker && trade.taker === mangoAccountAddress ? 'Taker' : 'Maker'
    if (liquidity == 'Taker') {
      side = trade.taker_side == 'bid' ? 'buy' : 'sell'
    } else {
      side = trade.taker_side == 'bid' ? 'sell' : 'buy'
    }
    size = trade.quantity
    const feeRate =
      trade.maker === mangoAccountAddress ? trade.maker_fee : trade.taker_fee
    feeCost = (trade.price * trade.quantity * feeRate).toFixed(5)
  }

  return {
    ...trade,
    liquidity,
    side,
    size,
    feeCost,
  }
}

export const formatTradeHistory = (
  group: Group,
  selectedMarket: Serum3Market | PerpMarket,
  mangoAccountAddress: string,
  tradeHistory: Array<CombinedTradeHistoryTypes>,
) => {
  return tradeHistory.flat().map((event) => {
    let trade
    let market = selectedMarket
    let time: string | number = ''
    if (isSerumFillEvent(event)) {
      trade = parseSerumEvent(event)
    } else if (isPerpFillEvent(event)) {
      trade = parsePerpEvent(mangoAccountAddress, event)
      market = selectedMarket

      time = trade.timestamp.toNumber() * 1000
    } else {
      trade = parseApiTradeHistory(mangoAccountAddress, event)
      time = trade.block_datetime
      if ('market' in trade) {
        market = group.getSerum3MarketByExternalMarket(
          new PublicKey(trade.market),
        )
      } else if ('perp_market' in trade) {
        market = group.getPerpMarketByMarketIndex(trade.market_index)
      }
    }

    return {
      ...trade,
      market,
      time,
    }
  })
}

const filterNewFills = (
  eventQueueFills: (SerumEvent | PerpFillEvent)[],
  apiTradeHistory: (SpotTradeHistory | PerpTradeHistory)[],
): (SerumEvent | PerpFillEvent)[] => {
  return eventQueueFills.filter((fill) => {
    return !apiTradeHistory.find((trade) => {
      if ('order_id' in trade && isSerumFillEvent(fill)) {
        return trade.order_id === fill.orderId.toString()
      } else if ('seq_num' in trade && isPerpFillEvent(fill)) {
        const fillTimestamp = new Date(
          fill.timestamp.toNumber() * 1000,
        ).getTime()
        const lastApiTradeTimestamp = new Date(
          apiTradeHistory[apiTradeHistory.length - 1].block_datetime,
        ).getTime()
        if (fillTimestamp < lastApiTradeTimestamp) return true
        return trade.seq_num === fill.seqNum.toNumber()
      }
    })
  })
}

const isTradeHistory = (
  response: null | EmptyObject | TradeHistoryApiResponseType[],
): response is TradeHistoryApiResponseType[] => {
  if (
    response &&
    Array.isArray(response) &&
    'activity_details' in response[0]
  ) {
    return true
  }
  return false
}

export const fetchTradeHistory = async (
  mangoAccountAddress: string,
  offset = 0,
  limit?: number,
): Promise<Array<PerpTradeHistory | SpotTradeHistory>> => {
  const tradesLimit = limit ? limit : PAGINATION_PAGE_LENGTH
  const response = await fetch(
    `${MANGO_DATA_API_URL}/stats/trade-history?mango-account=${mangoAccountAddress}&limit=${tradesLimit}&offset=${offset}`,
  )
  const jsonResponse: null | EmptyObject | TradeHistoryApiResponseType[] =
    await response.json()

  let data
  if (isTradeHistory(jsonResponse)) {
    data = jsonResponse.map((h) => h.activity_details)
  }

  return data ?? []
}

export default function useTradeHistory() {
  const { selectedMarket } = useSelectedMarket()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const fills = mangoStore((s) => s.selectedMarket.fills)

  const openOrderOwner = useMemo(() => {
    if (!mangoAccount || !selectedMarket) return
    if (selectedMarket instanceof PerpMarket) {
      return mangoAccount.publicKey
    } else {
      try {
        return mangoAccount.getSerum3OoAccount(selectedMarket.marketIndex)
          .address
      } catch {
        console.warn(
          'Unable to find OO account for mkt index',
          selectedMarket.marketIndex,
        )
      }
    }
  }, [mangoAccount, selectedMarket])

  const eventQueueFillsForOwner = useMemo(() => {
    if (!selectedMarket || !openOrderOwner) return []

    return fills.filter((fill) => {
      if (isSerumFillEvent(fill)) {
        // handles serum event queue for spot trades
        return openOrderOwner ? fill.openOrders.equals(openOrderOwner) : false
      } else if (isPerpFillEvent(fill)) {
        // handles mango event queue for perp trades
        return (
          fill.taker.equals(openOrderOwner) || fill.maker.equals(openOrderOwner)
        )
      }
    })
  }, [selectedMarket, openOrderOwner, fills])

  const response = useInfiniteQuery(
    ['trade-history', mangoAccountAddress],
    ({ pageParam }) => fetchTradeHistory(mangoAccountAddress, pageParam),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      enabled: !!mangoAccountAddress,
      keepPreviousData: true,
      refetchInterval: 1000 * 60 * 5,
      getNextPageParam: (_lastPage, pages) =>
        pages.length * PAGINATION_PAGE_LENGTH,
    },
  )

  const combinedTradeHistory = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return []

    const apiTradeHistory = response.data?.pages.flat() ?? []

    const newFills: (SerumEvent | PerpFillEvent)[] =
      eventQueueFillsForOwner?.length
        ? filterNewFills(eventQueueFillsForOwner, apiTradeHistory)
        : []

    const combinedHistory = [...newFills, ...apiTradeHistory]
    return formatTradeHistory(
      group,
      selectedMarket,
      mangoAccountAddress,
      combinedHistory,
    )
  }, [eventQueueFillsForOwner, mangoAccountAddress, response, selectedMarket])

  return { ...response, data: combinedTradeHistory }
}
