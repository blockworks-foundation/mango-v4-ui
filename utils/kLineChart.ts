import { SUPPORTED_RESOLUTIONS as SUPPORTED_SPOT_RESOLUTIONS } from 'apis/datafeed'

export const ONE_HOUR_MINS = 60
export const ONE_MINUTE_SECONDS = 60
export const ONE_HOUR_SECONDS = ONE_HOUR_MINS * ONE_MINUTE_SECONDS
export const ONE_DAY_SECONDS = ONE_HOUR_SECONDS * 24
export type BASE_CHART_QUERY = {
  address: string
  type: (typeof SUPPORTED_SPOT_RESOLUTIONS)[number]
  time_to: number
}
export type CHART_QUERY = BASE_CHART_QUERY & {
  time_from: number
}

//Translate values that api accepts to chart seconds
export const RES_NAME_TO_RES_VAL: {
  [key: string]: {
    val: (typeof SUPPORTED_SPOT_RESOLUTIONS)[number]
    seconds: number
  }
} = {
  '1m': { val: '1', seconds: ONE_MINUTE_SECONDS },
  '5m': { val: '5', seconds: 5 * ONE_MINUTE_SECONDS },
  '30m': {
    val: `30`,
    seconds: (ONE_HOUR_MINS / 2) * ONE_MINUTE_SECONDS,
  },
  '1H': { val: `60`, seconds: ONE_HOUR_SECONDS },
  '2H': { val: `120`, seconds: ONE_HOUR_SECONDS * 2 },
  '4H': { val: `240`, seconds: ONE_HOUR_SECONDS * 4 },
  '1D': { val: '1D', seconds: 24 * ONE_HOUR_SECONDS },
}
export const mainTechnicalIndicatorTypes = [
  'MA',
  'EMA',
  'SAR',
  'BOLL',
  'SMA',
  'BBI',
  'TRIX',
]
export const subTechnicalIndicatorTypes = [
  'VOL',
  'MACD',
  'RSI',
  'KDJ',
  'OBV',
  'CCI',
  'WR',
  'DMI',
  'MTM',
  'EMV',
]
export const DEFAULT_SUB_INDICATOR = 'VOL'
export const DEFAULT_MAIN_INDICATORS = ['EMA']
export const MAIN_INDICATOR_CLASS = 'candle_pane'
