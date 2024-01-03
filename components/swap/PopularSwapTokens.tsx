import mangoStore from '@store/mangoStore'
import { SwapFormTokenListType } from './SwapFormTokenList'
import { useMemo } from 'react'

const POPULAR_TOKENS = [
  { name: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { name: 'SOL', mint: 'So11111111111111111111111111111111111111112' },
  { name: 'mSOL', mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So' },
  { name: 'TBTC', mint: '6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU' },
]

const PopularSwapTokens = ({
  setSwapToken,
  type,
}: {
  setSwapToken: (token: string) => void
  type: SwapFormTokenListType
}) => {
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)

  // filter popular tokens when one in the list is selected for opposing input
  const popularTokensToShow = useMemo(() => {
    if (!inputBank || !outputBank) return POPULAR_TOKENS
    if (
      type?.includes('input') &&
      POPULAR_TOKENS.find((token) => token.mint === outputBank.mint.toString())
    ) {
      return POPULAR_TOKENS.filter(
        (token) => token.mint !== outputBank.mint.toString(),
      )
    }
    if (
      type === 'output' &&
      POPULAR_TOKENS.find((token) => token.mint === inputBank.mint.toString())
    ) {
      return POPULAR_TOKENS.filter(
        (token) => token.mint !== inputBank.mint.toString(),
      )
    }
    return POPULAR_TOKENS
  }, [inputBank, outputBank, type])

  return (
    <div className="flex flex-wrap">
      {popularTokensToShow.map((token) => (
        <button
          className="m-1 rounded-md border border-th-fgd-4 px-2 py-0.5 text-sm text-th-fgd-3 focus:outline-none md:hover:border-th-fgd-2 md:hover:text-th-fgd-2"
          onClick={() => setSwapToken(token.mint)}
          key={token.mint}
        >
          {token.name}
        </button>
      ))}
    </div>
  )
}

export default PopularSwapTokens
