import { useQuery } from '@tanstack/react-query'
import NotificationCookieStore from '@store/notificationCookieStore'
import { useWallet } from '@solana/wallet-adapter-react'
import { fetchNotificationSettings } from 'apis/notificationSettings'
import { useIsAuthorized } from './useIsAuthorized'

export function useNotificationSettings() {
  const { publicKey } = useWallet()
  const walletPubKey = publicKey?.toBase58()
  const token = NotificationCookieStore((s) => s.currentToken)
  const isAuth = useIsAuthorized()

  const criteria = walletPubKey && token && isAuth

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
