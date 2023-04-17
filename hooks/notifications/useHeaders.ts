import { useWallet } from '@solana/wallet-adapter-react'
import NotificationCookieStore from '@store/notificationCookieStore'

export function useHeaders() {
  const wallet = useWallet()
  const walletPubKey = wallet.publicKey?.toBase58()
  const token = NotificationCookieStore((s) => s.currentToken)

  return {
    headers: {
      authorization: token,
      publickey: walletPubKey || '',
      'Content-Type': 'application/json',
    },
  }
}
