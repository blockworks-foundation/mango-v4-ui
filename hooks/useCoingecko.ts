/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query'
import { Token } from 'types/jupiter'
import useJupiterMints from './useJupiterMints'

const fetchCoingecko = async (
  mangoTokens: Token[],
): Promise<{ prices: any[]; symbol: string }[]> => {
  const coingeckoIds = mangoTokens.map((token) => ({
    id: token.extensions?.coingeckoId,
    symbol: token.symbol,
  }))

  const promises: any = []
  for (const token of coingeckoIds) {
    if (token.id) {
      promises.push(
        fetch(
          `https://api.coingecko.com/api/v3/coins/${token.id}/market_chart?vs_currency=usd&days=1`,
        ).then((res) =>
          res.json().then((r) => ({ ...r, symbol: token.symbol })),
        ),
      )
    }
  }

  const data = await Promise.all(promises)

  return data || []
}

export const useCoingecko = () => {
  const { mangoTokens } = useJupiterMints()
  const res = useQuery<any[], Error>(
    ['coingecko-tokens'],
    () => fetchCoingecko(mangoTokens),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 1000 * 60 * 10,
      retry: 3,
      enabled: !!mangoTokens?.length,
      refetchOnWindowFocus: false,
    },
  )

  return {
    isLoading: res.isLoading,
    data: res.data || [],
  }
}
