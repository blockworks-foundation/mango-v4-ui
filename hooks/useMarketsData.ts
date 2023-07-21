import { useQuery } from '@tanstack/react-query'
import { MANGO_DATA_API_URL } from 'utils/constants'

const fetchMarketData = async () => {
  const promises = [
    fetch(`${MANGO_DATA_API_URL}/stats/perp-market-summary`),
    fetch(`${MANGO_DATA_API_URL}/stats/spot-market-summary`),
  ]
  try {
    const data = await Promise.all(promises)
    const perpData = await data[0].json()
    const spotData = await data[1].json()
    return { perpData, spotData }
  } catch (e) {
    console.log('failed to fetch market data', e)
    return { perpData: [], spotData: [] }
  }
}

export default function useMarketData() {
  return useQuery(['market-data'], () => fetchMarketData(), {
    cacheTime: 1000 * 60 * 10,
    staleTime: 1000 * 60,
    retry: 3,
    refetchOnWindowFocus: false,
    // enabled: market && market instanceof Serum3Market,
  })
}
