import { useQuery } from '@tanstack/react-query'
import { MANGO_DATA_API_URL } from 'utils/constants'
import useMangoAccount from './useMangoAccount'
import { TotalInterestDataItem } from 'types'

const fetchInterestData = async (mangoAccountPk: string) => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/stats/interest-account-total?mango-account=${mangoAccountPk}`,
    )
    const parsedResponse: Omit<TotalInterestDataItem, 'symbol'>[] | null =
      await response.json()
    if (parsedResponse) {
      const entries: [string, Omit<TotalInterestDataItem, 'symbol'>][] =
        Object.entries(parsedResponse).sort((a, b) => b[0].localeCompare(a[0]))

      const stats: TotalInterestDataItem[] = entries
        .map(([key, value]) => {
          return { ...value, symbol: key }
        })
        .filter((x) => x)
      return stats
    } else return []
  } catch (e) {
    console.log('Failed to fetch account funding', e)
    return []
  }
}

export default function useAccountInterest() {
  const { mangoAccountAddress } = useMangoAccount()
  const { data, isInitialLoading } = useQuery(
    ['account-interest-data', mangoAccountAddress],
    () => fetchInterestData(mangoAccountAddress),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccountAddress,
    },
  )
  return { data, isInitialLoading }
}
