import { useWallet } from '@solana/wallet-adapter-react'
import { useNotifications } from './useNotifications'
import NotificationCookieStore from '@store/notificationCookieStore'

export function useIsAuthorized() {
  const { publicKey, connected } = useWallet()
  const { error, isFetched, isLoading } = useNotifications()
  const token = NotificationCookieStore((s) => s.currentToken)

  const isAuthorized =
    publicKey?.toBase58() &&
    token &&
    !error &&
    isFetched &&
    !isLoading &&
    connected

  return isAuthorized
}
