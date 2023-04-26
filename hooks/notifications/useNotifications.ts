import { useQuery } from '@tanstack/react-query'
import { fetchNotifications } from 'apis/notifications'
import NotificationCookieStore from '@store/notificationCookieStore'
import { useWallet } from '@solana/wallet-adapter-react'

//10min
const refetchMs = 600000

export function useNotifications() {
  const { publicKey } = useWallet()
  const walletPubKey = publicKey?.toBase58()
  const token = NotificationCookieStore((s) => s.currentToken)
  const criteria = walletPubKey && token

  return useQuery(
    ['notifications', criteria],
    () => fetchNotifications(walletPubKey!, token!),
    {
      enabled: !!(walletPubKey && token),
      staleTime: refetchMs,
      retry: 1,
      refetchInterval: refetchMs,
    }
  )
}
