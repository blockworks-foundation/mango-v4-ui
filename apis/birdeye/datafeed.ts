import { makeApiRequest, parseResolution } from './helpers'
import { subscribeOnStream, unsubscribeFromStream } from './streaming'

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
  ],
  intraday_multipliers: ['1', '3', '5', '15', '30', '60', '120', '240'],
  exchanges: [],
}

async function getAllSymbols() {
  const data = await makeApiRequest(
    'public/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=-1'
  )

  return data.data.tokens
}

export default {
  onReady: (callback: any) => {
    console.log('[onReady]: Method call')
    setTimeout(() => callback(configurationData))
  },

  searchSymbols: async (
    _userInput: any,
    _exchange: any,
    _symbolType: any,
    _onResultReadyCallback: any
  ) => {
    return
  },

  resolveSymbol: async (
    symbolAddress: any,
    onSymbolResolvedCallback: any,
    _onResolveErrorCallback: any,
    _extension: any
  ) => {
    console.log('[resolveSymbol]: Method call', symbolAddress)
    const symbols = await getAllSymbols()
    let symbolItem = symbols.find((item: any) => item.address === symbolAddress)

    if (!symbolItem) {
      symbolItem = {
        address: symbolAddress,
        type: 'pair',
      }
    }

    const symbolInfo = {
      address: symbolItem.address,
      ticker: symbolItem.address,
      name: symbolItem.symbol || symbolItem.address,
      description: symbolItem.symbol
        ? symbolItem.symbol + '/USD'
        : symbolItem.address,
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
    }

    console.log('[resolveSymbol]: Symbol resolved', symbolAddress)
    onSymbolResolvedCallback(symbolInfo)
  },

  getBars: async (
    symbolInfo: any,
    resolution: any,
    periodParams: any,
    onHistoryCallback: any,
    onErrorCallback: any
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
      //@ts-ignore
      .map((name: any) => `${name}=${encodeURIComponent(urlParameters[name])}`)
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
      let bars: any = []
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
    symbolInfo: any,
    resolution: any,
    onRealtimeCallback: any,
    subscriberUID: any,
    onResetCacheNeededCallback: any
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
