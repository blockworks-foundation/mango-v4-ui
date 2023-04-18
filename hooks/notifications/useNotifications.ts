import { useQuery } from '@tanstack/react-query'
import { fetchNotifications } from 'fetches/notifications'
import NotificationCookieStore from '@store/notificationCookieStore'
import { useWallet } from '@solana/wallet-adapter-react'

export function useNotifications() {
  const wallet = useWallet()
  const walletPubKey = wallet.publicKey?.toBase58()
  const token = NotificationCookieStore((s) => s.currentToken)
  const criteria = `${walletPubKey}${token}`
  //10min
  const refetchMs = 10000

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
