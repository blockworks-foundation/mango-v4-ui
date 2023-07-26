import { useQuery } from '@tanstack/react-query'
import { fetchHourlyVolume } from 'utils/account'
import useMangoAccount from './useMangoAccount'

export default function useAccountHourlyVolumeStats() {
  const { mangoAccountAddress } = useMangoAccount()

  const {
    data: hourlyVolumeData,
    isLoading: loadingHourlyVolumeData,
    isFetching: fetchingHourlyVolumeData,
  } = useQuery(
    ['hourly-volume', mangoAccountAddress],
    () => fetchHourlyVolume(mangoAccountAddress),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccountAddress,
    },
  )

  const loadingHourlyVolume =
    fetchingHourlyVolumeData || loadingHourlyVolumeData

  return {
    hourlyVolumeData,
    loadingHourlyVolume,
  }
}
