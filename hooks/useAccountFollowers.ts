import { useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { MANGO_DATA_API_URL } from 'utils/constants'

const fetchAccountFollwers = async (walletPk: string | undefined) => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/user-data/followers?wallet-pk=${walletPk}`,
    )
    const data = await response.json()
    return data
  } catch (e) {
    console.error('failed to fetch account followers', e)
  }
}

export default function useAccountFollowers() {
  const { publicKey } = useWallet()
  const { data, isInitialLoading, refetch } = useQuery(
    ['account-followers', publicKey],
    () => fetchAccountFollwers(publicKey?.toString()),
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
