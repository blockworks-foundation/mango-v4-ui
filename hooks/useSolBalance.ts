import { TokenInstructions } from '@project-serum/serum'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import { MIN_SOL_BALANCE } from 'utils/constants'

export default function useSolBalance() {
  const walletTokens = mangoStore((s) => s.wallet.tokens)
  const solBalance: number = useMemo(() => {
    return (
      walletTokens.find((t) =>
        t.mint.equals(TokenInstructions.WRAPPED_SOL_MINT)
      )?.uiAmount || 0
    )
  }, [walletTokens])

  const maxSolDeposit: number = useMemo(() => {
    return solBalance - MIN_SOL_BALANCE
  }, [solBalance])

  return { solBalance, maxSolDeposit }
}
