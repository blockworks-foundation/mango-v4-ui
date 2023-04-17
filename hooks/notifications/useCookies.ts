import { useWallet } from '@solana/wallet-adapter-react'
import NotificationCookieStore from '@store/notificationCookieStore'
import { useEffect } from 'react'
import { useNotifications } from './useNotifications'
import { notify } from 'utils/notifications'

type Error = {
  response: {
    status: number
  }
}

export function useCookies() {
  const wallet = useWallet()
  const updateCookie = NotificationCookieStore((s) => s.updateCookie)
  const removeCookie = NotificationCookieStore((s) => s.removeCookie)
  const { error } = useNotifications()

  useEffect(() => {
    updateCookie(wallet.publicKey?.toBase58())
  }, [wallet.publicKey?.toBase58()])

  useEffect(() => {
    if ((error as Error)?.response?.status && wallet.publicKey) {
      removeCookie(wallet.publicKey?.toBase58())
      notify({
        title: 'Unauthorized for notifications',
        type: 'error',
      })
    }
  }, [error, wallet.publicKey?.toBase58()])
}
