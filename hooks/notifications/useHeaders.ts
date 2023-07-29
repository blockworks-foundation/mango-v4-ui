import { useWallet } from '@solana/wallet-adapter-react'
import NotificationCookieStore from '@store/notificationCookieStore'
import useMangoAccount from 'hooks/useMangoAccount'

export function useHeaders() {
  const { publicKey } = useWallet()
  const { mangoAccountAddress } = useMangoAccount()
  const token = NotificationCookieStore((s) => s.currentToken)

  return {
    headers: {
      authorization: token,
      'mango-account': mangoAccountAddress,
      publickey: publicKey?.toBase58() || '',
      'Content-Type': 'application/json',
    },
  }
}
