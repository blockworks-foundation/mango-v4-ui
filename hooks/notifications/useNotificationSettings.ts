import { useQuery } from '@tanstack/react-query'
import NotificationCookieStore from '@store/notificationCookieStore'
import { useWallet } from '@solana/wallet-adapter-react'
import { fetchNotificationSettings } from 'apis/notifications/notificationSettings'
import { useIsAuthorized } from './useIsAuthorized'
import { DAILY_MILLISECONDS } from 'utils/constants'
import useMangoAccount from 'hooks/useMangoAccount'

export function useNotificationSettings() {
  const { publicKey } = useWallet()
  const { mangoAccountAddress } = useMangoAccount()
  const walletPubKey = publicKey?.toBase58()
  const token = NotificationCookieStore((s) => s.currentToken)
  const isAuth = useIsAuthorized()

  const criteria = [token, isAuth, mangoAccountAddress]

  return useQuery(
    ['notificationSettings', ...criteria],
    () => fetchNotificationSettings(walletPubKey!, token!, mangoAccountAddress),
    {
      enabled: !!isAuth && !!mangoAccountAddress,
      retry: 1,
      staleTime: DAILY_MILLISECONDS,
    },
  )
}
