import { Bank } from 'mango-v4-test-pack'

export const useVaultLimits = (bank: Bank | undefined) => {
  const limit = bank?.getRemainingDepositLimit()
  const vaultFull =
    limit !== null && limit !== undefined && (limit.isZero() || limit.isNeg())

  return {
    limit,
    vaultFull,
  }
}
