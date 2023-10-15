import { useEffect, useState } from 'react'
import { notify } from 'utils/notifications'
import { useIsAuthorized } from './useIsAuthorized'
import { useWallet } from '@solana/wallet-adapter-react'
import NotificationCookieStore from '@store/notificationCookieStore'
import { useQueryClient } from '@tanstack/react-query'
import { Notification } from 'apis/notifications/notifications'
import { tryParse } from 'utils/formatting'
import { NotificationsWebSocket } from 'apis/notifications/websocket'
import useMangoAccount from 'hooks/useMangoAccount'
import { useCurrentSeason, useWalletPoints } from 'hooks/useRewards'

export function useNotificationSocket() {
  const isAuth = useIsAuthorized()
  const { publicKey } = useWallet()
  const { mangoAccountAddress } = useMangoAccount()
  const { wallet } = useWallet()
  const { data: seasonData } = useCurrentSeason()
  const { refetch } = useWalletPoints(
    mangoAccountAddress,
    seasonData?.season_id,
    wallet,
  )

  const token = NotificationCookieStore((s) => s.currentToken)

  const queryClient = useQueryClient()
  const criteria = [token, mangoAccountAddress]

  const [socket, setSocket] = useState<WebSocket | null>(null)

  useEffect(() => {
    if (socket && socket?.readyState === socket?.OPEN) {
      socket!.close(1000, 'hook')
    }

    let ws: WebSocket | null = null
    if (isAuth && publicKey && token && mangoAccountAddress) {
      const notificationWs = new NotificationsWebSocket(
        token,
        publicKey.toBase58(),
        mangoAccountAddress,
      ).connect()
      ws = notificationWs.ws!

      ws.addEventListener('message', (event) => {
        const data = tryParse(event.data)
        if (data.eventType === 'newNotification') {
          const newNotification = data.payload as Notification
          //we notify user about new data
          notify({
            title: newNotification.title,
            description: newNotification.content,
            type: 'info',
          })
          //we push new data to our notifications data
          queryClient.setQueryData<Notification[]>(
            ['notifications', ...criteria],
            (prevData) => {
              if (!prevData) {
                return []
              }
              // Modify prevData with newData and return the updated data
              return [newNotification, ...prevData]
            },
          )
          if (newNotification.title.toLowerCase().includes('points')) {
            refetch()
          }
        }
      })

      setSocket(ws)
    }

    // Clean up the WebSocket connection on unmount
    return () => {
      if (ws?.readyState === ws?.OPEN) {
        ws?.close(1000, 'hook')
      }

      if (socket?.readyState === socket?.OPEN) {
        socket?.close(1000, 'hook')
      }
    }
  }, [isAuth, token, mangoAccountAddress])
}
