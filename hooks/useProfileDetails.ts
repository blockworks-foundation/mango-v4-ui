import { useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { MANGO_DATA_API_URL } from 'utils/constants'

const fetchProfileDetails = async (walletPk: string | undefined) => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/user-data/profile-details?wallet-pk=${walletPk}`,
    )
    const data = await response.json()
    return data
  } catch (e) {
    console.error('failed to fetch profile details', e)
  }
}

export default function useProfileDetails() {
  const { publicKey } = useWallet()
  const { data, isInitialLoading, refetch } = useQuery(
    ['profile-details', publicKey],
    () => fetchProfileDetails(publicKey?.toString()),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!publicKey,
    },
  )
  return { data, isInitialLoading, refetch }
}
