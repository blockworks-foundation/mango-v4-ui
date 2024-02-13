import { MarketAccount } from '@openbook-dex/openbook-v2'

export function isOpenbookV2Market(obj: unknown): obj is MarketAccount {
  return typeof obj === 'object' && obj !== null && 'openOrdersAdmin' in obj
}
