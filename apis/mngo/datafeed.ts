/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeApiRequest, parseResolution } from './helpers'
import {
  subscribeOnStream,
  unsubscribeFromStream,
  closeSocket,
  isOpen,
} from './streaming'
import mangoStore from '@store/mangoStore'
import {
  DatafeedConfiguration,
  LibrarySymbolInfo,
  ResolutionString,
  SearchSymbolResultItem,
} from '@public/charting_library'

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

type SymbolInfo = LibrarySymbolInfo & {
  address: string
  base_token: string
  quote_token: string
}

const lastBarsCache = new Map()

const configurationData = {
  supported_resolutions: SUPPORTED_RESOLUTIONS,
  intraday_multipliers: ['1', '3', '5', '15', '30', '45', '60', '120', '240'],
  exchanges: [],
}

// async function getAllSymbols() {
//   const data = await makeApiRequest(
//     'public/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=-1'
//   )

//   return data.data.tokens
// }

export const queryBars = async (
  tokenAddress: string,
  resolution: (typeof SUPPORTED_RESOLUTIONS)[number],
  periodParams: {
    firstDataRequest: boolean
    from: number
    to: number
  },
): Promise<Bar[]> => {
  const { from, to } = periodParams
  const urlParameters = {
    'perp-market': tokenAddress,
    resolution: parseResolution(resolution),
    start_datetime: new Date(from * 1000).toISOString(),
    end_datetime: new Date(to * 1000).toISOString(),
  }
  const query = Object.keys(urlParameters)
    .map((name: string) => `${name}=${(urlParameters as any)[name]}`)
    .join('&')

  const data = await makeApiRequest(`/stats/candles-perp?${query}`)
  if (!data || !data.length) {
    return []
  }
  let previousBar: Bar | undefined = undefined
  let bars: Bar[] = []
  for (const bar of data) {
    const timestamp = new Date(bar.candle_start).getTime()
    if (timestamp >= from * 1000 && timestamp < to * 1000) {
      const open = previousBar ? previousBar.close : bar.open
      bars = [
        ...bars,
        {
          time: timestamp,
          low: bar.low,
          high: open > bar.high ? open : bar.high,
          open,
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

const datafeed = {
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
    const ticker = mangoStore.getState().selectedMarket.name

    const symbolInfo: SymbolInfo = {
      base_token: '',
      quote_token: '',
      address: symbolItem.address,
      ticker: symbolItem.address,
      name: symbolItem.symbol || symbolItem.address,
      description: ticker || symbolItem.address,
      type: symbolItem.type,
      session: '24x7',
      timezone: 'Etc/UTC',
      minmov: 1,
      pricescale: 100,
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
        symbolInfo.address,
        resolution as any,
        periodParams,
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
    subscribeOnStream(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscriberUID,
      onResetCacheNeededCallback,
      lastBarsCache.get(symbolInfo.address),
    )
  },

  unsubscribeBars: (subscriberUID: any) => {
    unsubscribeFromStream(subscriberUID)
  },
  closeSocket: () => {
    closeSocket()
  },
  name: 'mngo',
  isSocketOpen: isOpen,
}

export default datafeed
