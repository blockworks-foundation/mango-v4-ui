import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { fetchIsWhiteListed } from 'apis/whitelist'

const refetchMs = 24 * 60 * 60 * 1000

export function useIsWhiteListed() {
  const { publicKey } = useWallet()
  const walletPubKey = publicKey?.toBase58()
  const criteria = walletPubKey

  return useQuery(
    ['isWhiteListed', criteria],
    () => fetchIsWhiteListed(walletPubKey!),
    {
      enabled: !!walletPubKey,
      staleTime: refetchMs,
      retry: 1,
      refetchInterval: refetchMs,
    },
  )
}
