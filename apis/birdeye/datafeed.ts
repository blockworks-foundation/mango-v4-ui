import { makeApiRequest, parseResolution } from './helpers'
import { subscribeOnStream, unsubscribeFromStream } from './streaming'
import mangoStore from '@store/mangoStore'
import {
  DatafeedConfiguration,
  LibrarySymbolInfo,
  ResolutionString,
  SearchSymbolResultItem,
} from '@public/charting_library/charting_library'

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
  '1W',
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
}

const lastBarsCache = new Map()

const configurationData = {
  supported_resolutions: SUPPORTED_RESOLUTIONS,
  intraday_multipliers: ['1', '3', '5', '15', '30', '60', '120', '240'],
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
    const ticker = mangoStore.getState().selectedMarket.name

    const symbolInfo: SymbolInfo = {
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
      const bars = await queryBars(
        symbolInfo.address,
        resolution as any,
        periodParams
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
    subscribeOnStream(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscriberUID,
      onResetCacheNeededCallback,
      lastBarsCache.get(symbolInfo.address)
    )
  },

  unsubscribeBars: () => {
    console.warn('[unsubscribeBars]')
    unsubscribeFromStream()
  },
}
