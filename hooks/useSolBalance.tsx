import { TokenInstructions } from '@project-serum/serum'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'

export default function useSolBalance() {
  const walletTokens = mangoStore((s) => s.wallet.tokens)
  const solBalance = useMemo(() => {
    return (
      walletTokens.find((t) =>
        t.mint.equals(TokenInstructions.WRAPPED_SOL_MINT)
      )?.uiAmount || 0
    )
  }, [walletTokens])
  return solBalance
}
