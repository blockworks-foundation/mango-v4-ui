import { useQuery } from '@tanstack/react-query'
import { fetchNotifications } from 'apis/notifications/notifications'
import NotificationCookieStore from '@store/notificationCookieStore'
import { useWallet } from '@solana/wallet-adapter-react'
import useMangoAccount from 'hooks/useMangoAccount'

//10min
const refetchMs = 600000

export function useNotifications() {
  const { publicKey } = useWallet()
  const { mangoAccountAddress } = useMangoAccount()

  const walletPubKey = publicKey?.toBase58()
  const token = NotificationCookieStore((s) => s.currentToken)
  const criteria = [token, mangoAccountAddress]

  return useQuery(
    ['notifications', ...criteria],
    () => fetchNotifications(walletPubKey!, token!, mangoAccountAddress),
    {
      enabled: !!(walletPubKey && token && mangoAccountAddress),
      staleTime: refetchMs,
      retry: 1,
      refetchInterval: refetchMs,
    },
  )
}
