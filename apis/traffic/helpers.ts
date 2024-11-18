import Decimal from 'decimal.js'
import { DAILY_SECONDS, QUOTE_TOKEN_MINTS } from 'utils/constants'

/* eslint-disable @typescript-eslint/no-explicit-any */
export const NEXT_PUBLIC_BIRDEYE_API_KEY =
  process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || '5afdc994b457493ea9a8882fbf695f46'

export const API_URL = 'https://public-api.birdeye.so/'

export const socketUrl = `wss://public-api.birdeye.so/socket?x-api-key=${NEXT_PUBLIC_BIRDEYE_API_KEY}`

// Make requests to Birdeye API
export async function makeApiRequest(path: string) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'X-API-KEY': NEXT_PUBLIC_BIRDEYE_API_KEY,
      'x-chain': 'solana',
    },
  })
  return response.json()
}

const RESOLUTION_MAPPING: Record<string, string> = {
  '1': 'M1',
  '5': 'M5',
  '15': 'M15',
  '60': 'H1',
  '240': 'H4',
}

export function parseResolution(resolution: string) {
  if (!resolution || !RESOLUTION_MAPPING[resolution])
    return RESOLUTION_MAPPING[0]

  return RESOLUTION_MAPPING[resolution]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getNextBarTime(lastBar: any, resolution = '60') {
  if (!lastBar) return
  const nextBarTime = 1 * 60 * 1000 + lastBar.time

  // const lastCharacter = resolution.slice(-1)
  // let nextBarTime

  // switch (true) {
  //   case lastCharacter === 'W':
  //     nextBarTime = 7 * 24 * 60 * 60 * 1000 + lastBar.time
  //     break

  //   case lastCharacter === 'D':
  //     nextBarTime = 1 * 24 * 60 * 60 * 1000 + lastBar.time
  //     break

  //   default:
  //     nextBarTime = 1 * 60 * 1000 + lastBar.time
  //     break
  // }

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
  const quoteMint = QUOTE_TOKEN_MINTS.includes(outputMint)
    ? outputMint
    : inputMint
  const baseMint = quoteMint === outputMint ? inputMint : outputMint
  const inputQuery = `defi/history_price?address=${baseMint}&address_type=token&type=${interval}&time_from=${queryStart}&time_to=${queryEnd}`
  const outputQuery = `defi/history_price?address=${quoteMint}&address_type=token&type=${interval}&time_from=${queryStart}&time_to=${queryEnd}`
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
          (data: any) => data.unixTime === item.unixTime,
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
