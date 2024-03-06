import { Bank } from '@blockworks-foundation/mango-v4'
import { TOKEN_REDUCE_ONLY_OPTIONS } from './constants'

export const isBankVisibleForUser = (
  bank: Bank,
  borrowedAmount: number,
  balance: number,
) => {
  return (
    bank.reduceOnly !== TOKEN_REDUCE_ONLY_OPTIONS.ENABLED ||
    (bank.reduceOnly === TOKEN_REDUCE_ONLY_OPTIONS.ENABLED &&
      borrowedAmount !== 0 &&
      balance !== 0)
  )
}
