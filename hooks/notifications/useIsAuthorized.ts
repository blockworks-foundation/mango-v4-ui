import { useWallet } from '@solana/wallet-adapter-react'
import { useNotifications } from './useNotifications'
import NotificationCookieStore from '@store/notificationCookieStore'
import useMangoAccount from 'hooks/useMangoAccount'

export function useIsAuthorized() {
  const { publicKey, connected } = useWallet()
  const { mangoAccountAddress } = useMangoAccount()
  const { error, isFetched, isLoading } = useNotifications()
  const token = NotificationCookieStore((s) => s.currentToken)

  const isAuthorized =
    publicKey?.toBase58() &&
    mangoAccountAddress &&
    token &&
    !error &&
    isFetched &&
    !isLoading &&
    connected

  return isAuthorized
}
