import { useQuery } from '@tanstack/react-query'
import { fetchNotifications } from 'fetches/notifications'
import NotificationCookieStore from '@store/notificationCookieStore'
import { useWallet } from '@solana/wallet-adapter-react'

export function useNotifications() {
  const wallet = useWallet()
  const walletPubKey = wallet.publicKey?.toBase58()
  const token = NotificationCookieStore((s) => s.currentToken)
  const criteria = `${walletPubKey}${token}`

  return useQuery(
    ['notifications', criteria],
    () => fetchNotifications(walletPubKey!, token!),
    {
      enabled: !!(walletPubKey && token),
      staleTime: 600000,
      retry: 1,
    }
  )
}
