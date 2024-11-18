/* eslint-disable @typescript-eslint/no-explicit-any */
import { parseResolution } from './traffic/helpers'
import {
  closeSocket,
  isOpen,
  subscribeOnStream as subscribeOnSpotStream,
} from './traffic/streaming'
import {
  DatafeedConfiguration,
  LibrarySymbolInfo,
  ResolutionString,
  SearchSymbolResultItem,
} from '@public/charting_library'

export const SUPPORTED_RESOLUTIONS = ['1', '5', '15', '60', '240'] as const

type Bar = {
  low: number
  high: number
  open: number
  close: number
  time: number
}

export type SymbolInfo = LibrarySymbolInfo & {
  address: string
  quote_token: string
  base_token: string
}

const lastBarsCache = new Map()

const configurationData = {
  supported_resolutions: SUPPORTED_RESOLUTIONS,
  intraday_multipliers: ['1', '5', '15', '60', '240'],
  exchanges: [],
}

export const queryBars = async (
  tokenAddress: string,
  resolution: (typeof SUPPORTED_RESOLUTIONS)[number],
  periodParams: {
    firstDataRequest: boolean
    from: number
    to: number
  },
  quote_token: string,
): Promise<Bar[]> => {
  try {
    const { from, to } = periodParams

    const urlParameters = {
      base_mint: tokenAddress,
      quote_mint: quote_token,
      period: parseResolution(resolution),
      from: from,
      time_to: to,
      limit: 1000,
    }

    const query = Object.keys(urlParameters)
      .map(
        (name: string) =>
          `${name}=${encodeURIComponent((urlParameters as any)[name])}`,
      )
      .join('&')

    const response = await fetch(
      `https://api.mngo.cloud/traffic/v1/candles?${query}`,
    )

    const data = await response.json()

    if (!data?.candles?.length) {
      return []
    }
    const candles = data.candles.reverse()
    const bars: Bar[] = []
    for (const bar of candles) {
      if (bar.timestamp >= from && bar.timestamp < to) {
        const time = bar.timestamp * 1000
        const formattedBar = {
          time,
          low: bar.low,
          high: bar.high,
          open: bar.open,
          close: bar.close,
          volume: bar.volume,
        }

        bars.push(formattedBar)
      }
    }
    return bars
  } catch (e) {
    console.log('failed to query bars', e)
    return []
  }
}

const datafeed = (
  base_token_mint: string,
  base_token_name: string,
  quote_token_mint: string,
  quote_token_name: string,
) => ({
  onReady: (callback: (configuration: DatafeedConfiguration) => void) => {
    setTimeout(() => callback(configurationData as any))
  },

  searchSymbols: async (
    _userInput: string,
    _exchange: string,
    _symbolType: string,
    _onResultReadyCallback: (items: SearchSymbolResultItem[]) => void,
  ) => {
    return
  },

  resolveSymbol: async (
    symbolAddress: string,
    onSymbolResolvedCallback: (symbolInfo: SymbolInfo) => void,
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

    const ticker = `${base_token_name}/${quote_token_name}`
    const quote_token = quote_token_mint
    const base_token = base_token_mint

    const symbolInfo: SymbolInfo = {
      quote_token,
      base_token,
      address: base_token,
      ticker: symbolItem.address,
      name: ticker || symbolItem.address,
      description: ticker || symbolItem.address,
      type: symbolItem.type,
      session: '24x7',
      timezone: 'Etc/UTC',
      minmov: 1,
      pricescale: 10 ** 15,
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
      },
    ) => void,
    onErrorCallback: (e: any) => void,
  ) => {
    try {
      const { firstDataRequest } = periodParams
      const bars = await queryBars(
        symbolInfo.base_token,
        resolution as any,
        periodParams,
        symbolInfo.quote_token,
      )
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
    onResetCacheNeededCallback: () => void,
  ) => {
    subscribeOnSpotStream(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      onResetCacheNeededCallback,
      lastBarsCache.get(symbolInfo.address),
    )
  },

  unsubscribeBars: (subscriberUID: string) => {
    closeSocket()
    // unsubscribeFromStream(subscriberUID)
  },

  closeSocket: () => {
    closeSocket()
  },

  name: 'traffic',
  isSocketOpen: isOpen,
})

export default datafeed
