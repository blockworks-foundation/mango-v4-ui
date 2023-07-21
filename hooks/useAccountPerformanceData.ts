import { useQuery } from '@tanstack/react-query'
import { fetchAccountPerformance } from 'utils/account'
import useMangoAccount from './useMangoAccount'
import { useMemo } from 'react'
import { PerformanceDataItem } from 'types'
import { DAILY_MILLISECONDS } from 'utils/constants'

export default function useAccountPerformanceData() {
  const { mangoAccountAddress } = useMangoAccount()

  const {
    data: performanceData,
    isLoading: loadingPerformanceData,
    isFetching: fetchingPerformanceData,
  } = useQuery(
    ['performance', mangoAccountAddress],
    () => fetchAccountPerformance(mangoAccountAddress, 31),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccountAddress,
    },
  )

  const rollingDailyData: PerformanceDataItem[] | [] = useMemo(() => {
    if (!performanceData || !performanceData.length) return []
    const nowDate = new Date()
    return performanceData.filter((d) => {
      const dataTime = new Date(d.time).getTime()
      return dataTime >= nowDate.getTime() - DAILY_MILLISECONDS
    })
  }, [performanceData])

  const performanceLoading = loadingPerformanceData || fetchingPerformanceData

  return {
    performanceData,
    rollingDailyData,
    loadingPerformanceData,
    fetchingPerformanceData,
    performanceLoading,
  }
}
