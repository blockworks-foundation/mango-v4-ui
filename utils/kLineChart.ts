export const ONE_HOUR_MINS = 60
export const ONE_MINUTE_SECONDS = 60
export const ONE_HOUR_SECONDS = ONE_HOUR_MINS * ONE_MINUTE_SECONDS
export const ONE_DAY_SECONDS = ONE_HOUR_SECONDS * 24
export type BASE_CHART_QUERY = {
  address: string
  type: string
  time_to: number
}
export type CHART_QUERY = BASE_CHART_QUERY & {
  time_from: number
}
export type HISTORY = {
  c: number
  h: number
  l: number
  o: number
  unixTime: number
  v: number
}
//Translate values that api accepts to chart seconds
export const RES_NAME_TO_RES_VAL: {
  [key: string]: {
    val: string
    seconds: number
  }
} = {
  '1m': { val: '1M', seconds: ONE_MINUTE_SECONDS },
  '5m': { val: '5M', seconds: 5 * ONE_MINUTE_SECONDS },
  '30m': {
    val: `30M`,
    seconds: (ONE_HOUR_MINS / 2) * ONE_MINUTE_SECONDS,
  },
  '1H': { val: `1H`, seconds: ONE_HOUR_SECONDS },
  '2H': { val: `2H`, seconds: ONE_HOUR_SECONDS * 2 },
  '4H': { val: `4H`, seconds: ONE_HOUR_SECONDS * 4 },
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
