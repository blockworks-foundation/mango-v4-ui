import {
  AccountPerformanceData,
  AccountVolumeTotalData,
  EmptyObject,
  FilledOrdersApiResponseType,
  FormattedHourlyAccountVolumeData,
  HourlyAccountVolumeData,
  PerformanceDataItem,
  TotalAccountFundingItem,
} from 'types'
import { MANGO_DATA_API_URL } from './constants'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { NumberFormatValues, SourceInfo } from 'react-number-format'

export const fetchAccountPerformance = async (
  mangoAccountPk: string,
  range: number,
) => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/stats/performance_account?mango-account=${mangoAccountPk}&start-date=${dayjs()
        .subtract(range, 'day')
        .format('YYYY-MM-DD')}`,
    )
    const parsedResponse: null | EmptyObject | AccountPerformanceData[] =
      await response.json()
    if (parsedResponse && Object.keys(parsedResponse)?.length) {
      const entries = Object.entries(parsedResponse).sort((a, b) =>
        b[0].localeCompare(a[0]),
      )
      const stats = entries.map(([key, value]) => {
        return { ...value, time: key } as PerformanceDataItem
      })

      return stats.reverse()
    } else return []
  } catch (e) {
    console.error('Failed to load account performance data', e)
    return []
  }
}

export const fetchFundingTotals = async (mangoAccountPk: string) => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/stats/funding-account-total?mango-account=${mangoAccountPk}`,
    )
    const res = await data.json()
    if (res) {
      const entries: [string, Omit<TotalAccountFundingItem, 'market'>][] =
        Object.entries(res)

      const stats: TotalAccountFundingItem[] = entries
        .map(([key, value]) => {
          return {
            long_funding: value.long_funding * -1,
            short_funding: value.short_funding * -1,
            market: key,
          }
        })
        .filter((x) => x)

      return stats
    }
  } catch (e) {
    console.log('Failed to fetch account funding', e)
  }
}

export const fetchVolumeTotals = async (mangoAccountPk: string) => {
  try {
    const [perpTotal, spotTotal] = await Promise.all([
      fetch(
        `${MANGO_DATA_API_URL}/stats/perp-volume-total?mango-account=${mangoAccountPk}`,
      ),
      fetch(
        `${MANGO_DATA_API_URL}/stats/spot-volume-total?mango-account=${mangoAccountPk}`,
      ),
    ])

    const [perpTotalData, spotTotalData] = await Promise.all([
      perpTotal.json(),
      spotTotal.json(),
    ])

    const combinedData = [perpTotalData, spotTotalData]
    if (combinedData.length) {
      return combinedData.reduce((a, c) => {
        const entries: AccountVolumeTotalData[] = Object.entries(c)
        const marketVol = entries.reduce((a, c) => {
          let volumeUsd = c[1].volume_usd
          if (!c[0].includes('PERP')) {
            // The spot API reports volume by token so volume needs to be divided by 2
            volumeUsd = volumeUsd / 2
          }
          return a + volumeUsd
        }, 0)
        return a + marketVol
      }, 0)
    }
    return 0
  } catch (e) {
    console.log('Failed to fetch spot volume', e)
    return 0
  }
}

const formatHourlyVolumeData = (data: HourlyAccountVolumeData[]) => {
  if (!data || !data.length) return []
  const formattedData: FormattedHourlyAccountVolumeData[] = []

  // Loop through each object in the original data array
  for (const obj of data) {
    // Loop through the keys (markets) in each object
    for (const market in obj) {
      // Loop through the timestamps in each market
      for (const timestamp in obj[market]) {
        // Find the corresponding entry in the formatted data array based on the timestamp
        let entry = formattedData.find((item) => item.time === timestamp)

        // If the entry doesn't exist, create a new entry
        if (!entry) {
          entry = { time: timestamp, total_volume_usd: 0, markets: {} }
          formattedData.push(entry)
        }
        let objVolumeDecimal = new Decimal(obj[market][timestamp].volume_usd)
        if (!market.includes('PERP')) {
          // The spot API reports volume by token so volume needs to be divided by 2
          objVolumeDecimal = objVolumeDecimal.div(2)
        }
        if (objVolumeDecimal.gt(0)) {
          // Increment the total_volume_usd by the volume_usd value
          entry.total_volume_usd = new Decimal(entry.total_volume_usd)
            .plus(objVolumeDecimal)
            .toNumber()

          // Add or update the market entry in the markets object
          entry.markets[market] = objVolumeDecimal.toNumber()
        }
      }
    }
  }

  return formattedData
}

export const fetchHourlyVolume = async (mangoAccountPk: string) => {
  try {
    const [perpHourly, spotHourly] = await Promise.all([
      fetch(
        `${MANGO_DATA_API_URL}/stats/perp-volume-hourly?mango-account=${mangoAccountPk}`,
      ),
      fetch(
        `${MANGO_DATA_API_URL}/stats/spot-volume-hourly?mango-account=${mangoAccountPk}`,
      ),
    ])

    const [perpHourlyData, spotHourlyData] = await Promise.all([
      perpHourly.json(),
      spotHourly.json(),
    ])
    const hourlyVolume = []

    hourlyVolume.push(perpHourlyData)
    hourlyVolume.push(spotHourlyData)
    return formatHourlyVolumeData(hourlyVolume)
  } catch (e) {
    console.log('Failed to fetch spot volume', e)
  }
}

export const fetchFilledOrders = async (
  mangoAccountPk: string,
  orderIds: string[],
) => {
  try {
    const idString = orderIds.map((i) => `&id=${i}`).join('')
    const resp = await fetch(
      `https://api.mngo.cloud/data/v4/user-data/filled-orders?mango-account=${mangoAccountPk}` +
        idString,
    )
    const response: FilledOrdersApiResponseType = await resp.json()
    return response
  } catch (e) {
    console.log('Failed to fetch filled orders', e)
  }
}

export const handleInputChange = (
  e: NumberFormatValues,
  info: SourceInfo,
  setInputAmount: (amt: string) => void,
  setSizePercentage: (pct: string) => void,
) => {
  if (info.source === 'event') {
    setSizePercentage('')
  }
  setInputAmount(!Number.isNaN(Number(e.value)) ? e.value : '')
}
