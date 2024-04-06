import { useQuery } from '@tanstack/react-query'
import useMangoAccount from './useMangoAccount'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { HourlyFundingData, HourlyFundingStatsData } from 'types'

const fetchHourlyFunding = async (mangoAccountPk: string) => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/stats/funding-account-hourly?mango-account=${mangoAccountPk}`,
    )
    const res = await data.json()
    if (res) {
      const entries: HourlyFundingData[] = Object.entries(res)

      const stats: HourlyFundingStatsData[] = entries.map(([key, value]) => {
        const marketEntries = Object.entries(value)
        const marketFunding = marketEntries.map(([key, value]) => {
          return {
            long_funding: value.long_funding * -1,
            short_funding: value.short_funding * -1,
            time: key,
          }
        })
        return { marketFunding, market: key }
      })

      return stats
    }
  } catch (e) {
    console.log('Failed to fetch account funding history', e)
  }
}

export default function useAccountHourlyFunding() {
  const { mangoAccountAddress } = useMangoAccount()

  const { data, isLoading, isFetching, refetch } = useQuery(
    ['hourly-funding', mangoAccountAddress],
    () => fetchHourlyFunding(mangoAccountAddress),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccountAddress,
    },
  )

  const loading = isLoading || isFetching

  return {
    data,
    loading,
    refetch,
  }
}
