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
  const { publicKey, disconnecting } = useWallet()
  const updateCookie = NotificationCookieStore((s) => s.updateCookie)
  const removeCookie = NotificationCookieStore((s) => s.removeCookie)
  const resetCurrentToken = NotificationCookieStore((s) => s.resetCurrentToken)
  const token = NotificationCookieStore((s) => s.currentToken)
  const { error } = useNotifications()
  const errorResp = error as Error

  useEffect(() => {
    updateCookie(publicKey?.toBase58())
  }, [publicKey?.toBase58()])

  useEffect(() => {
    if (disconnecting) {
      resetCurrentToken()
    }
    return () => {
      resetCurrentToken()
    }
  }, [disconnecting])

  useEffect(() => {
    if (errorResp?.status === 401 && publicKey && token) {
      removeCookie(publicKey?.toBase58())
      notify({
        title: errorResp.error,
        type: 'error',
      })
    }
  }, [errorResp, publicKey?.toBase58()])
}
