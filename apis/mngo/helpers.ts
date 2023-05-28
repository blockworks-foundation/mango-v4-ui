/* eslint-disable @typescript-eslint/no-explicit-any */
import { MANGO_DATA_API_URL } from 'utils/constants'

// Make requests to mngo.cloud API
export async function makeApiRequest(path: string) {
  try {
    const response = await fetch(`${MANGO_DATA_API_URL}${path}`)
    return response.json()
  } catch (error: any) {
    throw new Error(`mngo.cloud request error: ${error.status}`)
  }
}

export async function makeSpotApiRequest(path: string) {
  try {
    const response = await fetch(`https://api.mngo.cloud/openbook/v1${path}`)
    return response.json()
  } catch (error: any) {
    throw new Error(`mngo.cloud request error: ${error.status}`)
  }
}

const RESOLUTION_MAPPING: Record<string, string> = {
  '1': '1',
  '3': '3',
  '5': '5',
  '15': '15',
  '30': '30',
  '45': '45',
  '60': '60',
  '120': '120',
  '240': '240',
  '1D': '1440',
  '1W': '10080',
}

const RESOLUTION_MAPPING_SPOT: Record<string, string> = {
  '1': '1M',
  '3': '3M',
  '5': '5M',
  '15': '15M',
  '30': '30M',
  '60': '1H',
  '120': '2H',
  '240': '4H',
  '1D': '1D',
}

export function parseResolution(resolution: string) {
  if (!resolution || !RESOLUTION_MAPPING[resolution])
    return RESOLUTION_MAPPING[0]

  return RESOLUTION_MAPPING[resolution]
}

export function parseResolutionSpot(resolution: string) {
  if (!resolution || !RESOLUTION_MAPPING_SPOT[resolution])
    return RESOLUTION_MAPPING_SPOT[0]

  return RESOLUTION_MAPPING_SPOT[resolution]
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
