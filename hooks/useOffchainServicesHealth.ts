import useInterval from '@components/shared/useInterval'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

const fetchOffchainHealth = async () => {
  try {
    const [dbHealthResponse, redisHealthResponse, serverHealthResponse] =
      await Promise.all([
        fetch('https://api.mngo.cloud/data/health/db'),
        fetch('https://api.mngo.cloud/data/health/redis'),
        fetch('https://api.mngo.cloud/data/health/server'),
      ])
    const [dbHealth, redisHealth, serverHealth] = await Promise.all([
      dbHealthResponse.json(),
      redisHealthResponse.json(),
      serverHealthResponse.json(),
    ])
    return { dbHealth, redisHealth, serverHealth }
  } catch (e) {
    console.log('Failed to check offchain services health', e)
    return { dbHealth: 500, redisHealth: 500, serverHealth: 500 }
  }
}

export default function useOffchainServicesHealth() {
  const {
    data: offchainHealthData,
    isLoading,
    refetch,
  } = useQuery(['offchain-health'], () => fetchOffchainHealth(), {
    cacheTime: 1000 * 60 * 10,
    staleTime: 1000 * 60,
    retry: 3,
  })

  useInterval(() => {
    refetch()
  }, 60 * 1000)

  const offchainHealth = useMemo(() => {
    if (!offchainHealthData) return 500
    const somethingWrong = Object.values(offchainHealthData).filter(
      (v) => v !== 200,
    )
    if (!somethingWrong.length) {
      return 200
    } else if (somethingWrong.length < 3) {
      return 300
    } else return 500
  }, [offchainHealthData])
  return { offchainHealth, isLoading }
}
