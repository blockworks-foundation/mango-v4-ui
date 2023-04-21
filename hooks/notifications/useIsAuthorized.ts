import { useWallet } from '@solana/wallet-adapter-react'
import { useNotifications } from './useNotifications'
import NotificationCookieStore from '@store/notificationCookieStore'

export function useIsAuthorized() {
  const wallet = useWallet()
  const { error, isFetched, isLoading } = useNotifications()
  const walletPubKey = wallet.publicKey?.toBase58()
  const token = NotificationCookieStore((s) => s.currentToken)

  const isAuthorized =
    walletPubKey && token && !error && isFetched && !isLoading

  return isAuthorized
}
