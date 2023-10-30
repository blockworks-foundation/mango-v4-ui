const POPULAR_TOKENS = [
  { name: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { name: 'SOL', mint: 'So11111111111111111111111111111111111111112' },
  { name: 'mSOL', mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So' },
  { name: 'wBTC', mint: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh' },
]

const PopularSwapTokens = ({
  setSwapToken,
}: {
  setSwapToken: (token: string) => void
}) => {
  return (
    <div className="flex flex-wrap">
      {POPULAR_TOKENS.map((token) => (
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
