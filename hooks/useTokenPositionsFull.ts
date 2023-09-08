import { Bank } from '@blockworks-foundation/mango-v4'
import useMangoAccountAccounts from './useMangoAccountAccounts'
import { useMemo } from 'react'

export default function useTokenPositionsFull(
  buyBank: Bank | undefined,
  sellBank: Bank | undefined,
) {
  const { usedTokens, totalTokens } = useMangoAccountAccounts()
  const tokenPositionsFull = useMemo(() => {
    if (!buyBank || !sellBank || !usedTokens.length || !totalTokens.length)
      return false
    const hasInputTokenPosition = usedTokens.find(
      (token) => token.tokenIndex === buyBank.tokenIndex,
    )
    const hasOutputTokenPosition = usedTokens.find(
      (token) => token.tokenIndex === sellBank.tokenIndex,
    )
    const availableTokenPositions = totalTokens.length - usedTokens.length
    if (
      (hasInputTokenPosition && hasOutputTokenPosition) ||
      availableTokenPositions >= 2
    ) {
      return false
    } else if (
      (hasInputTokenPosition && !hasOutputTokenPosition) ||
      (!hasInputTokenPosition && hasOutputTokenPosition)
    ) {
      return availableTokenPositions >= 1 ? false : true
    } else return true
  }, [buyBank, sellBank, usedTokens, totalTokens])

  return tokenPositionsFull
}
