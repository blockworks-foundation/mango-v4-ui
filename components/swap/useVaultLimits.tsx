import { Bank } from '@blockworks-foundation/mango-v4'

export const useVaultLimits = (bank: Bank | undefined) => {
  const limit = bank?.getRemainingDepositLimit()
  const vaultFull =
    limit !== null && limit !== undefined && (limit.isZero() || limit.isNeg())

  return {
    limit,
    vaultFull,
  }
}
