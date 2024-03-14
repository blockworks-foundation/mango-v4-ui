import { OpenbookV2Market } from '@blockworks-foundation/mango-v4'
import { MarketAccount, OpenOrdersAccount } from '@openbook-dex/openbook-v2'
import { PublicKey } from '@solana/web3.js'

// Define a new interface that extends MarketAccount and adds the tickSize property
export interface ExtendedMarketAccount extends MarketAccount {
  tickSize: number
  minOrderSize: number
  publicKey: PublicKey
}

export function isOpenbookV2ExternalMarket(
  obj: unknown,
): obj is ExtendedMarketAccount {
  return typeof obj === 'object' && obj !== null && 'openOrdersAdmin' in obj
}

export function isOpenbookV2Market(obj: unknown): obj is OpenbookV2Market {
  return (
    typeof obj === 'object' && obj !== null && 'openbookMarketExternal' in obj
  )
}

export function isOpenbookV2OpenOrder(obj: unknown): obj is OpenOrdersAccount {
  return typeof obj === 'object' && obj !== null && 'delegate' in obj
}
