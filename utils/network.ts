import { Connection } from '@solana/web3.js'
import { sleep } from 'utils'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getNetworkInfo() {
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection
  if (connection) {
    return connection.effectiveType
  }
  return 'unknown'
}

export default function isNetworkSlow() {
  return ['slow-2g', '2g', '3g'].includes(getNetworkInfo()) ? true : false
}

export async function waitForSlot(connection: Connection, slot: number) {
  let lastSlot = 0
  while (slot > lastSlot) {
    lastSlot = await connection.getSlot()
    await sleep(250)
  }
}
