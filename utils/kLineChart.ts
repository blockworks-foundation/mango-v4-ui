export const ONE_HOUR_MINS = 60
export const ONE_MINUTE_SECONDS = 60
export const ONE_HOUR_SECONDS = ONE_HOUR_MINS * ONE_MINUTE_SECONDS
export const ONE_DAY_SECONDS = ONE_HOUR_SECONDS * 24
export type BASE_CHART_QUERY = {
  resolution: string
  symbol: string
  to: number
}
export type CHART_QUERY = BASE_CHART_QUERY & {
  from: number
}
export type HISTORY = {
  c: string[]
  h: string[]
  l: string[]
  o: string[]
  t: number[]
  v: string[]
}
//Translate values that api accepts to chart seconds
export const RES_NAME_TO_RES_VAL: {
  [key: string]: {
    val: string
    seconds: number
  }
} = {
  '1m': { val: '1', seconds: ONE_MINUTE_SECONDS },
  '5m': { val: '5', seconds: 5 * ONE_MINUTE_SECONDS },
  '30m': {
    val: `${ONE_HOUR_MINS / 2}`,
    seconds: (ONE_HOUR_MINS / 2) * ONE_MINUTE_SECONDS,
  },
  '1H': { val: `${ONE_HOUR_MINS}`, seconds: ONE_HOUR_SECONDS },
  '2H': { val: `${2 * ONE_HOUR_MINS}`, seconds: ONE_HOUR_SECONDS * 2 },
  '4H': { val: `${4 * ONE_HOUR_MINS}`, seconds: ONE_HOUR_SECONDS * 4 },
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
