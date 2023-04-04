import { useQuery } from '@tanstack/react-query'
import { makeApiRequest } from 'apis/birdeye/helpers'
import { Token } from 'types/jupiter'
import { BirdeyePriceResponse } from './useBirdeyeMarketPrices'
import useJupiterMints from './useJupiterMints'

const fetchBirdeyePrices = async (
  mangoTokens: Token[]
): Promise<{ data: BirdeyePriceResponse[]; mint: string }[]> => {
  const mints = mangoTokens.map((token) => token.address)

  const promises = []
  for (const mint of mints) {
    const queryEnd = Math.floor(Date.now() / 1000)
    const queryStart = queryEnd - 86400
    const query = `defi/history_price?address=${mint}&address_type=token&type=30m&time_from=${queryStart}&time_to=${queryEnd}`
    promises.push(makeApiRequest(query))
  }

  const responses = await Promise.all(promises)
  if (responses.length) {
    return responses.map((res) => ({
      data: res.data.items,
      mint: res.data.items[0].address,
    }))
  }

  return []
}

export const useBirdeyeTokenPrices = () => {
  const { mangoTokens } = useJupiterMints()
  const res = useQuery(
    ['birdeye-token-prices'],
    () => fetchBirdeyePrices(mangoTokens),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 1000 * 60 * 10,
      retry: 3,
      enabled: !!mangoTokens?.length,
      refetchOnWindowFocus: false,
    }
  )

  return {
    isLoading: res?.isLoading,
    data: res?.data || [],
  }
}
