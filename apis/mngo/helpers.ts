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
