import { Serum3Market } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import { makeApiRequest } from 'apis/birdeye/helpers'
import { DAILY_SECONDS } from 'utils/constants'

export interface BirdeyePriceResponse {
  address: string
  unixTime: number
  value: number
}

const fetchBirdeyePrices = async (
  spotMarkets: Serum3Market[],
): Promise<{ data: BirdeyePriceResponse[]; mint: string }[]> => {
  const mints = spotMarkets.map((market) =>
    market.serumMarketExternal.toString(),
  )

  const promises = []
  const queryEnd = Math.floor(Date.now() / 1000)
  const queryStart = queryEnd - DAILY_SECONDS
  for (const mint of mints) {
    const query = `defi/history_price?address=${mint}&address_type=pair&type=30m&time_from=${queryStart}&time_to=${queryEnd}`
    promises.push(makeApiRequest(query))
  }

  const responses = await Promise.all(promises)
  if (responses?.length) {
    return responses.map((res) => ({
      data: res.data.items,
      mint: res.data.items[0]?.address,
    }))
  }

  return []
}

export const useBirdeyeMarketPrices = () => {
  const spotMarkets = mangoStore((s) => s.serumMarkets)
  const res = useQuery(
    ['birdeye-market-prices'],
    () => fetchBirdeyePrices(spotMarkets),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 1000 * 60 * 10,
      retry: 3,
      enabled: !!spotMarkets?.length,
      refetchOnWindowFocus: false,
    },
  )

  return {
    isFetching: res?.isFetching,
    isLoading: res?.isLoading,
    data: res?.data || [],
  }
}
