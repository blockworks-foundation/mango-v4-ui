import Decimal from 'decimal.js'
import { BirdeyePriceResponse } from 'types'
import { DAILY_SECONDS } from 'utils/constants'

/* eslint-disable @typescript-eslint/no-explicit-any */
export const NEXT_PUBLIC_BIRDEYE_API_KEY =
  process.env.NEXT_PUBLIC_BIRDEYE_API_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NzM0NTE4MDF9.KTEqB1hrmZTMzk19rZNx9aesh2bIHj98Cb8sg5Ikz-Y'

export const API_URL = 'https://public-api.birdeye.so/'

export const socketUrl = `wss://public-api.birdeye.so/socket?x-api-key=${NEXT_PUBLIC_BIRDEYE_API_KEY}`

// Make requests to Birdeye API
export async function makeApiRequest(path: string) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'X-API-KEY': NEXT_PUBLIC_BIRDEYE_API_KEY,
    },
  })
  return response.json()
}

const RESOLUTION_MAPPING: Record<string, string> = {
  '1': '1m',
  '3': '3m',
  '5': '5m',
  '15': '15m',
  '30': '30m',
  '60': '1H',
  '120': '2H',
  '240': '4H',
  '1D': '1D',
  '1W': '1W',
}

export function parseResolution(resolution: string) {
  if (!resolution || !RESOLUTION_MAPPING[resolution])
    return RESOLUTION_MAPPING[0]

  return RESOLUTION_MAPPING[resolution]
}

export function getNextBarTime(lastBar: any, resolution = '1D') {
  if (!lastBar) return

  const lastCharacter = resolution.slice(-1)
  let nextBarTime

  switch (true) {
    case lastCharacter === 'W':
      nextBarTime = 7 * 24 * 60 * 60 * 1000 + lastBar.time
      break

    case lastCharacter === 'D':
      nextBarTime = 1 * 24 * 60 * 60 * 1000 + lastBar.time
      break

    default:
      nextBarTime = 1 * 60 * 1000 + lastBar.time
      break
  }

  return nextBarTime
}

export const SUBSCRIPT_NUMBER_MAP: Record<number, string> = {
  4: '₄',
  5: '₅',
  6: '₆',
  7: '₇',
  8: '₈',
  9: '₉',
  10: '₁₀',
  11: '₁₁',
  12: '₁₂',
  13: '₁₃',
  14: '₁₄',
  15: '₁₅',
}

export const calcPricePrecision = (num: number | string) => {
  if (!num) return 8

  switch (true) {
    case Math.abs(+num) < 0.00000000001:
      return 16

    case Math.abs(+num) < 0.000000001:
      return 14

    case Math.abs(+num) < 0.0000001:
      return 12

    case Math.abs(+num) < 0.00001:
      return 10

    case Math.abs(+num) < 0.05:
      return 6

    case Math.abs(+num) < 1:
      return 4

    case Math.abs(+num) < 20:
      return 3

    default:
      return 2
  }
}

export const formatPrice = (
  num: number,
  precision?: number,
  gr0 = true,
): string => {
  if (!num) {
    return num.toString()
  }

  if (!precision) {
    precision = calcPricePrecision(+num)
  }

  let formated: string = new Decimal(num).toFixed(precision)

  if (formated.match(/^0\.[0]+$/g)) {
    formated = formated.replace(/\.[0]+$/g, '')
  }

  if (gr0 && formated.match(/\.0{4,15}[1-9]+/g)) {
    const match = formated.match(/\.0{4,15}/g)
    if (!match) return ''
    const matchString: string = match[0].slice(1)
    formated = formated.replace(
      /\.0{4,15}/g,
      `.0${SUBSCRIPT_NUMBER_MAP[matchString.length]}`,
    )
  }

  return formated
}

export type SwapChartDataItem = {
  time: number
  price: number
  inputTokenPrice: number
  outputTokenPrice: number
}

export const fetchSwapChartPrices = async (
  inputMint: string | undefined,
  outputMint: string | undefined,
  daysToShow: string,
) => {
  if (!inputMint || !outputMint) return []
  const interval = daysToShow === '1' ? '30m' : daysToShow === '7' ? '1H' : '4H'
  const queryEnd = Math.floor(Date.now() / 1000)
  const queryStart = queryEnd - parseInt(daysToShow) * DAILY_SECONDS
  const inputQuery = `defi/history_price?address=${inputMint}&address_type=token&type=${interval}&time_from=${queryStart}&time_to=${queryEnd}`
  const outputQuery = `defi/history_price?address=${outputMint}&address_type=token&type=${interval}&time_from=${queryStart}&time_to=${queryEnd}`
  try {
    const [inputResponse, outputResponse] = await Promise.all([
      makeApiRequest(inputQuery),
      makeApiRequest(outputQuery),
    ])

    if (
      inputResponse.success &&
      inputResponse?.data?.items?.length &&
      outputResponse.success &&
      outputResponse?.data?.items?.length
    ) {
      const parsedData: SwapChartDataItem[] = []
      const inputData = inputResponse.data.items
      const outputData = outputResponse.data.items

      for (const item of inputData) {
        const outputDataItem = outputData.find(
          (data: BirdeyePriceResponse) => data.unixTime === item.unixTime,
        )

        const curentTimestamp = Date.now() / 1000

        if (outputDataItem && item.unixTime <= curentTimestamp) {
          parsedData.push({
            time: Math.floor(item.unixTime * 1000),
            price: item.value / outputDataItem.value,
            inputTokenPrice: item.value,
            outputTokenPrice: outputDataItem.value,
          })
        }
      }
      return parsedData
    } else return []
  } catch (e) {
    console.log('failed to fetch swap chart data from birdeye', e)
    return []
  }
}
