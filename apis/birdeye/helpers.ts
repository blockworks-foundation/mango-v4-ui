export const BE_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2Njc1NTI4MzV9.FpbBT3M6GN_TKSJ8CarGeOMU5U7ZUvgZOIy8789m1bk'

export const API_URL = 'https://public-api.birdeye.so/'

// Make requests to CryptoCompare API
export async function makeApiRequest(path: string) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        'X-API-KEY': BE_API_KEY,
      },
    })
    return response.json()
  } catch (error: any) {
    throw new Error(`CryptoCompare request error: ${error.status}`)
  }
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
