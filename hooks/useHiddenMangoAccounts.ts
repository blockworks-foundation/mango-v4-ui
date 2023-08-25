import { useQuery } from '@tanstack/react-query'
import { MANGO_DATA_API_URL } from 'utils/constants'

const fetchAllHiddenMangoAccounts = async () => {
  // returns Promise<string[]>
  try {
    const hideResponse = await fetch(
      `${MANGO_DATA_API_URL}/user-data/private-accounts`,
    )
    const res = await hideResponse.json()
    return res?.private_accounts ?? []
  } catch (e) {
    console.log('Failed to fetch spot volume', e)
  }
}

export function useHiddenMangoAccounts() {
  const { data: hiddenAccounts, isLoading: loadingHiddenAccounts } = useQuery(
    ['all-hidden-accounts'],
    () => fetchAllHiddenMangoAccounts(),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  )

  return {
    hiddenAccounts,
    loadingHiddenAccounts,
  }
}
