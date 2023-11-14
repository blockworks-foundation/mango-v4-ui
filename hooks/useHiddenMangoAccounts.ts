import { useQuery } from '@tanstack/react-query'
import { MANGO_DATA_API_URL } from 'utils/constants'

const fetchAllHiddenMangoAccounts = async (): Promise<string[]> => {
  try {
    const hideResponse = await fetch(
      `${MANGO_DATA_API_URL}/user-data/private-accounts`,
    )
    const res = await hideResponse.json()
    return res?.private_accounts ?? []
  } catch (e) {
    console.error('Failed to fetch private mango accounts', e)
    return []
  }
}

export function useHiddenMangoAccounts() {
  const { data: hiddenAccounts, isInitialLoading: loadingHiddenAccounts } =
    useQuery(['all-hidden-accounts'], () => fetchAllHiddenMangoAccounts(), {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
    })

  return {
    hiddenAccounts,
    loadingHiddenAccounts,
  }
}
