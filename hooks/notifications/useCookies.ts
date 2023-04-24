import { useWallet } from '@solana/wallet-adapter-react'
import NotificationCookieStore from '@store/notificationCookieStore'
import { useEffect } from 'react'
import { useNotifications } from './useNotifications'
import { notify } from 'utils/notifications'

type Error = {
  status: number
  error: string
}

export function useCookies() {
  const wallet = useWallet()
  const updateCookie = NotificationCookieStore((s) => s.updateCookie)
  const removeCookie = NotificationCookieStore((s) => s.removeCookie)
  const token = NotificationCookieStore((s) => s.currentToken)
  const { error } = useNotifications()
  const errorResp = error as Error

  useEffect(() => {
    updateCookie(wallet.publicKey?.toBase58())
  }, [wallet.publicKey?.toBase58()])

  useEffect(() => {
    if (errorResp?.status === 401 && wallet.publicKey && token) {
      removeCookie(wallet.publicKey?.toBase58())
      notify({
        title: errorResp.error,
        type: 'error',
      })
    }
  }, [errorResp, wallet.publicKey?.toBase58()])
}
