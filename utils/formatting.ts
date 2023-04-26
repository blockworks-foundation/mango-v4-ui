import { PublicKey } from '@solana/web3.js'
import { formatNumericValue, numberCompacter } from './numbers'

export function abbreviateAddress(address: PublicKey, size = 5) {
  const base58 = address.toBase58()
  return base58.slice(0, size) + '…' + base58.slice(-size)
}

export const formatYAxis = (value: number) => {
  return value === 0
    ? '0'
    : Math.abs(value) > 1
    ? numberCompacter.format(value)
    : formatNumericValue(value, 4)
}

export const tryParse = (val: string) => {
  try {
    const json = JSON.parse(val)
    return json
  } catch (e) {
    return val
  }
}
