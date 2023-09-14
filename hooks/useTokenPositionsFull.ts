import { Bank } from '@blockworks-foundation/mango-v4'
import useMangoAccountAccounts from './useMangoAccountAccounts'
import { useMemo } from 'react'

export default function useTokenPositionsFull(banks: Array<Bank | undefined>) {
  const { usedTokens, totalTokens } = useMangoAccountAccounts()
  const tokenPositionsFull = useMemo(() => {
    if (
      banks.every((bank) => bank === undefined) ||
      !usedTokens.length ||
      !totalTokens.length
    )
      return false
    let alreadyHasPositionCount = 0
    for (const bank of banks) {
      const hasPosition = usedTokens.find(
        (token) => token.tokenIndex === bank?.tokenIndex,
      )
      if (hasPosition) {
        alreadyHasPositionCount += 1
      }
    }
    const availableTokenPositions = totalTokens.length - usedTokens.length
    if (
      banks.length === 2 &&
      (alreadyHasPositionCount === 2 || availableTokenPositions >= 2)
    ) {
      return false
    }
    if (
      banks.length === 1 &&
      (alreadyHasPositionCount === 1 || availableTokenPositions >= 1)
    ) {
      return false
    }
    return true
  }, [banks, usedTokens, totalTokens])

  return tokenPositionsFull
}
