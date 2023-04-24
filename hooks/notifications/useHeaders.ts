import { useWallet } from '@solana/wallet-adapter-react'
import NotificationCookieStore from '@store/notificationCookieStore'

export function useHeaders() {
  const { publicKey } = useWallet()
  const token = NotificationCookieStore((s) => s.currentToken)

  return {
    headers: {
      authorization: token,
      publickey: publicKey?.toBase58() || '',
      'Content-Type': 'application/json',
    },
  }
}
