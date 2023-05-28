/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeApiRequest, parseResolution } from './birdeye/helpers'
import {
  makeApiRequest as makePerpApiRequest,
  makeSpotApiRequest,
  parseResolution as parsePerpResolution,
  parseResolutionSpot,
} from './mngo/helpers'
import {
  closeSocket,
  // isOpen,
  subscribeOnStream as subscribeOnSpotStream,
  unsubscribeFromStream,
} from './birdeye/streaming'
import {
  closeSocket as closePerpSocket,
  // isOpen as isPerpOpen,
  subscribeOnStream as subscribeOnPerpStream,
  unsubscribeFromStream as unsubscribeFromPerpStream,
} from './mngo/streaming'
import mangoStore from '@store/mangoStore'
import {
  DatafeedConfiguration,
  LibrarySymbolInfo,
  ResolutionString,
  SearchSymbolResultItem,
} from '@public/charting_library'
import { PublicKey } from '@solana/web3.js'
import { Group } from '@blockworks-foundation/mango-v4'

export const SUPPORTED_RESOLUTIONS = [
  '1',
  '3',
  '5',
  '15',
  '30',
  '60',
  '120',
  '240',
  '1D',
] as const

type BaseBar = {
  low: number
  high: number
  open: number
  close: number
}

type KlineBar = BaseBar & {
  volume: number
  timestamp: number
}

type TradingViewBar = BaseBar & {
  time: number
}

type Bar = KlineBar & TradingViewBar

export type SymbolInfo = LibrarySymbolInfo & {
  address: string
}

const lastBarsCache = new Map()

const subscriptionIds = new Map()

const configurationData = {
  supported_resolutions: SUPPORTED_RESOLUTIONS,
  intraday_multipliers: ['1', '3', '5', '15', '30', '60', '120', '240'],
  exchanges: [],
}

const getTickerFromMktAddress = (
  group: Group,
  symbolAddress: string
): string | null => {
  try {
    const serumMkt = group.getSerum3MarketByExternalMarket(
      new PublicKey(symbolAddress)
    )

    if (serumMkt) {
      return serumMkt.name
    }
  } catch {
    console.log('Address is not a serum market')
  }

  const perpMarkets = Array.from(group.perpMarketsMapByMarketIndex.values())
  const perpMkt = perpMarkets.find(
    (perpMarket) => perpMarket.publicKey.toString() === symbolAddress
  )

  if (perpMkt) {
    return perpMkt.name
  }

  return null
}

let marketType: 'spot' | 'perp'

export const queryPerpBars = async (
  tokenAddress: string,
  resolution: typeof SUPPORTED_RESOLUTIONS[number],
  periodParams: {
    firstDataRequest: boolean
    from: number
    to: number
  }
): Promise<Bar[]> => {
  const { from, to } = periodParams

  const urlParameters = {
    'perp-market': tokenAddress,
    resolution: parsePerpResolution(resolution),
    start_datetime: new Date(from * 1000).toISOString(),
    end_datetime: new Date(to * 1000).toISOString(),
  }

  const query = Object.keys(urlParameters)
    .map((name: string) => `${name}=${(urlParameters as any)[name]}`)
    .join('&')
  const data = await makePerpApiRequest(`/stats/candles-perp?${query}`)
  if (!data || !data.length) {
    return []
  }
  let bars: Bar[] = []
  let previousBar: Bar | undefined = undefined
  for (const bar of data) {
    const timestamp = new Date(bar.candle_start).getTime()
    if (timestamp >= from * 1000 && timestamp < to * 1000) {
      bars = [
        ...bars,
        {
          time: timestamp,
          low: bar.low,
          high: bar.high,
          open: previousBar ? previousBar.close : bar.open,
          close: bar.close,
          volume: bar.volume,
          timestamp,
        },
      ]
      previousBar = bar
    }
  }
  return bars
}

export const querySpotBars = async (
  marketName: string,
  resolution: typeof SUPPORTED_RESOLUTIONS[number],
  periodParams: {
    firstDataRequest: boolean
    from: number
    to: number
  }
): Promise<Bar[]> => {
  console.log(marketName, resolution)
  const { from, to } = periodParams
  const urlParameters = {
    market_name: marketName,
    resolution: parseResolutionSpot(resolution),
    from: from,
    to: to,
  }
  const query = Object.keys(urlParameters)
    .map(
      (name: string) =>
        `${name}=${encodeURIComponent((urlParameters as any)[name])}`
    )
    .join('&')

  const data = await makeSpotApiRequest(`/candles?${query}`)
  if (!data.s || data.s != 'ok' || data.time.length === 0) {
    return []
  }
  // {
  //   "s": "ok",
  //   "time": [1651189320, 1651189380],
  //   "close": [1.2090027797967196, 1.2083083698526025],
  //   "open": [1.2090027797967196, 1.208549999864772],
  //   "high": [1.2090027797967196, 1.208549999864772],
  //   "low": [1.2090027797967196, 1.208055029856041],
  //   "volume": [0, 0]
  // }
  let bars: Bar[] = []
  for (let i = 0; i < data.time.length; i++) {
    if (data.time[i] >= from && data.time[i] < to) {
      const timestamp = data.time[i] * 1000
      bars = [
        ...bars,
        {
          time: timestamp,
          low: data.low[i],
          high: data.high[i],
          open: data.open[i],
          close: data.close[i],
          volume: data.volume[i],
          timestamp,
        },
      ]
    }
  }
  return bars
}

export const queryBirdeyeBars = async (
  tokenAddress: string,
  resolution: typeof SUPPORTED_RESOLUTIONS[number],
  periodParams: {
    firstDataRequest: boolean
    from: number
    to: number
  }
): Promise<Bar[]> => {
  const { from, to } = periodParams
  const urlParameters = {
    address: tokenAddress,
    type: parseResolution(resolution),
    time_from: from,
    time_to: to,
  }
  const query = Object.keys(urlParameters)
    .map(
      (name: string) =>
        `${name}=${encodeURIComponent((urlParameters as any)[name])}`
    )
    .join('&')

  const data = await makeApiRequest(`defi/ohlcv/pair?${query}`)
  if (!data.success || data.data.items.length === 0) {
    return []
  }

  let bars: Bar[] = []
  for (const bar of data.data.items) {
    if (bar.unixTime >= from && bar.unixTime < to) {
      const timestamp = bar.unixTime * 1000
      if (bar.h >= 223111) continue
      bars = [
        ...bars,
        {
          time: timestamp,
          low: bar.l,
          high: bar.h,
          open: bar.o,
          close: bar.c,
          volume: bar.v,
          timestamp,
        },
      ]
    }
  }
  return bars
}

export default {
  onReady: (callback: (configuration: DatafeedConfiguration) => void) => {
    setTimeout(() => callback(configurationData as any))
  },

  searchSymbols: async (
    _userInput: string,
    _exchange: string,
    _symbolType: string,
    _onResultReadyCallback: (items: SearchSymbolResultItem[]) => void
  ) => {
    return
  },

  resolveSymbol: async (
    symbolAddress: string,
    onSymbolResolvedCallback: (symbolInfo: SymbolInfo) => void
    // _onResolveErrorCallback: any,
    // _extension: any
  ) => {
    let symbolItem:
      | {
          address: string
          type: string
          symbol: string
        }
      | undefined

    if (!symbolItem) {
      symbolItem = {
        address: symbolAddress,
        type: 'pair',
        symbol: '',
      }
    }

    const mangoStoreState = mangoStore.getState()
    const group = mangoStoreState.group
    let ticker = mangoStoreState.selectedMarket.name

    if (group && symbolAddress) {
      const newTicker = getTickerFromMktAddress(group, symbolAddress)
      if (newTicker) {
        ticker = newTicker
      }
    }

    const symbolInfo: SymbolInfo = {
      address: symbolItem.address,
      ticker: symbolItem.address,
      name: ticker || symbolItem.address,
      description: ticker || symbolItem.address,
      type: symbolItem.type,
      session: '24x7',
      timezone: 'Etc/UTC',
      minmov: 1,
      pricescale: 10 ** 16,
      has_intraday: true,
      has_weekly_and_monthly: false,
      has_empty_bars: true,
      supported_resolutions: configurationData.supported_resolutions as any,
      intraday_multipliers: configurationData.intraday_multipliers,
      volume_precision: 2,
      data_status: 'streaming',
      full_name: '',
      exchange: '',
      listed_exchange: '',
      format: 'price',
    }

    onSymbolResolvedCallback(symbolInfo)
  },
  getBars: async (
    symbolInfo: SymbolInfo,
    resolution: ResolutionString,
    periodParams: {
      countBack: number
      firstDataRequest: boolean
      from: number
      to: number
    },
    onHistoryCallback: (
      bars: Bar[],
      t: {
        noData: boolean
      }
    ) => void,
    onErrorCallback: (e: any) => void
  ) => {
    try {
      const { firstDataRequest } = periodParams
      let bars
      if (
        symbolInfo.description?.includes('PERP') &&
        symbolInfo.address !== '8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6'
      ) {
        marketType = 'perp'
        bars = await queryPerpBars(
          symbolInfo.address,
          resolution as any,
          periodParams
        )
      } else {
        marketType = 'spot'
        console.log(symbolInfo)
        bars = await querySpotBars(
          symbolInfo.name,
          resolution as any,
          periodParams
        )
      }
      if (!bars || bars.length === 0) {
        // "noData" should be set if there is no data in the requested period.
        onHistoryCallback([], {
          noData: true,
        })
        return
      }
      if (firstDataRequest) {
        lastBarsCache.set(symbolInfo.address, {
          ...bars[bars.length - 1],
        })
      }
      onHistoryCallback(bars, {
        noData: false,
      })
      return bars
    } catch (error) {
      console.warn('[getBars]: Get error', error)
      onErrorCallback(error)
    }
  },

  subscribeBars: (
    symbolInfo: SymbolInfo,
    resolution: string,
    onRealtimeCallback: (data: any) => void,
    subscriberUID: string,
    onResetCacheNeededCallback: () => void
  ) => {
    subscriptionIds.set(subscriberUID, symbolInfo.address)
    if (symbolInfo.description?.includes('PERP')) {
      subscribeOnPerpStream(
        symbolInfo,
        resolution,
        onRealtimeCallback,
        subscriberUID,
        onResetCacheNeededCallback,
        lastBarsCache.get(symbolInfo.address)
      )
    } else {
      subscribeOnSpotStream(
        symbolInfo,
        resolution,
        onRealtimeCallback,
        subscriberUID,
        onResetCacheNeededCallback,
        lastBarsCache.get(symbolInfo.address)
      )
    }
  },

  unsubscribeBars: (subscriberUID: string) => {
    if (marketType === 'perp') {
      unsubscribeFromPerpStream(subscriberUID)
    } else {
      unsubscribeFromStream()
    }
  },

  closeSocket: () => {
    if (marketType === 'spot') {
      closeSocket()
    } else {
      closePerpSocket()
    }
  },

  name: 'birdeye',

  // isSocketOpen: marketType === 'spot' ? isOpen : isPerpOpen,
}
