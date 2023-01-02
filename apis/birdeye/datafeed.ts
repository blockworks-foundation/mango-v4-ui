import { makeApiRequest, parseResolution } from './helpers'
import { subscribeOnStream, unsubscribeFromStream } from './streaming'
import mangoStore from '@store/mangoStore'
import {
  DatafeedConfiguration,
  LibrarySymbolInfo,
  ResolutionString,
  SearchSymbolResultItem,
} from '@public/charting_library/charting_library'

type Bar = {
  time: number
  low: number
  high: number
  open: number
  close: number
}

type SymbolInfo = LibrarySymbolInfo & {
  address: string
}

const lastBarsCache = new Map()

const configurationData = {
  supported_resolutions: [
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
  ] as ResolutionString[],
  intraday_multipliers: ['1', '3', '5', '15', '30', '60', '120', '240'],
  exchanges: [],
}

// async function getAllSymbols() {
//   const data = await makeApiRequest(
//     'public/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=-1'
//   )

//   return data.data.tokens
// }

export default {
  onReady: (callback: (configuration: DatafeedConfiguration) => void) => {
    console.log('[onReady]: Method call')
    setTimeout(() => callback(configurationData))
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
    console.log(
      '[resolveSymbol]: Method call',
      symbolAddress,
      onSymbolResolvedCallback
    )
    // const symbols = await getAllSymbols()
    // let symbolItem = symbols.find((item: any) => item.address === symbolAddress)
    // console.log('========symbols:', symbolItem, symbols)
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
      has_no_volume: true,
      has_weekly_and_monthly: false,
      supported_resolutions: configurationData.supported_resolutions,
      intraday_multipliers: configurationData.intraday_multipliers,
      volume_precision: 2,
      data_status: 'streaming',
      full_name: '',
      exchange: '',
      listed_exchange: '',
      format: 'price',
    }

    console.log('[resolveSymbol]: Symbol resolved', symbolAddress)
    onSymbolResolvedCallback(symbolInfo)
  },

  getBars: async (
    symbolInfo: SymbolInfo,
    resolution: string,
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
    const { from, to, firstDataRequest } = periodParams
    console.log('[getBars]: Method call', symbolInfo, resolution, from, to)
    const urlParameters = {
      address: symbolInfo.address,
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
    try {
      const data = await makeApiRequest(`defi/ohlcv/pair?${query}`)
      if (!data.success || data.data.items.length === 0) {
        // "noData" should be set if there is no data in the requested period.
        onHistoryCallback([], {
          noData: true,
        })
        return
      }
      let bars: Bar[] = []
      data.data.items.forEach((bar: any) => {
        if (bar.unixTime >= from && bar.unixTime < to) {
          bars = [
            ...bars,
            {
              time: bar.unixTime * 1000,
              low: bar.l,
              high: bar.h,
              open: bar.o,
              close: bar.c,
            },
          ]
        }
      })

      if (firstDataRequest) {
        lastBarsCache.set(symbolInfo.address, {
          ...bars[bars.length - 1],
        })
      }
      console.log(`[getBars]: returned ${bars.length} bar(s)`)
      onHistoryCallback(bars, {
        noData: false,
      })
    } catch (error) {
      console.log('[getBars]: Get error', error)
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
    console.log(
      '[subscribeBars]: Method call with subscriberUID:',
      subscriberUID
    )
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
    console.log('[unsubscribeBars]')
    unsubscribeFromStream()
  },
}
