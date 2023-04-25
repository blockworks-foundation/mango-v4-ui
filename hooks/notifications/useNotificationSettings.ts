import { useQuery } from '@tanstack/react-query'
import NotificationCookieStore from '@store/notificationCookieStore'
import { useWallet } from '@solana/wallet-adapter-react'
import { fetchNotificationSettings } from 'apis/notificationSettings'
import { useIsAuthorized } from './useIsAuthorized'

export function useNotificationSettings() {
  const wallet = useWallet()
  const walletPubKey = wallet.publicKey?.toBase58()
  const token = NotificationCookieStore((s) => s.currentToken)
  const criteria = walletPubKey && token
  const isAuth = useIsAuthorized()

  return useQuery(
    ['notificationSettings', criteria],
    () => fetchNotificationSettings(walletPubKey!, token!),
    {
      enabled: !!isAuth,
      retry: 1,
      staleTime: 86400000,
    }
  )
}
