import { Group, Serum3Market } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import { makeApiRequest } from 'apis/birdeye/helpers'

export interface BirdeyePriceResponse {
  address: string
  unixTime: number
  value: number
}

const fetchBirdeyePrices = async (
  spotMarkets: Serum3Market[],
  group: Group | undefined
): Promise<{ data: BirdeyePriceResponse[]; mint: string }[]> => {
  const mints = spotMarkets.map((market) => {
    const baseBank = group?.getFirstBankByTokenIndex(market.baseTokenIndex)
    return baseBank?.mint.toString()
  })

  const promises = []
  const queryEnd = Math.floor(Date.now() / 1000)
  const queryStart = queryEnd - 86400
  for (const mint of mints) {
    if (!mint) continue
    const query = `defi/history_price?address=${mint}&address_type=token&type=30m&time_from=${queryStart}&time_to=${queryEnd}`
    promises.push(makeApiRequest(query))
  }

  const responses = await Promise.all(promises)
  if (responses?.length) {
    return responses.map((res) => ({
      data: res.data.items,
      mint: res.data.items[0].address,
    }))
  }

  return []
}

export const useBirdeyeMarketPrices = () => {
  const spotMarkets = mangoStore((s) => s.serumMarkets)
  const group = mangoStore((s) => s.group)
  const res = useQuery(
    ['birdeye-market-prices'],
    () => fetchBirdeyePrices(spotMarkets, group),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 1000 * 60 * 10,
      retry: 3,
      enabled: !!spotMarkets?.length,
      refetchOnWindowFocus: false,
    }
  )

  return {
    isFetching: res?.isFetching,
    isLoading: res?.isLoading,
    data: res?.data || [],
  }
}
