import { useQuery } from '@tanstack/react-query'
import { MANGO_DATA_API_URL } from 'utils/constants'

export const fetchSwapVolume = async () => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/stats/mango-swap-volume`,
    )
    const data = await response.json()
    return data
  } catch (e) {
    console.log('Failed to fetch swap volume', e)
    return []
  }
}

const SwapVolumeChart = () => {
  const { data } = useQuery(['mango-swap-volume'], () => fetchSwapVolume(), {
    cacheTime: 1000 * 60 * 10,
    staleTime: 1000 * 60,
    retry: 3,
    refetchOnWindowFocus: false,
  })

  console.log(data)

  return <div />
}

export default SwapVolumeChart
