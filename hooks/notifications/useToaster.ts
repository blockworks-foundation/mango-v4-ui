import { useEffect, useState } from 'react'
import { notify } from 'utils/notifications'
import { useIsAuthorized } from './useIsAuthorized'
import { useWallet } from '@solana/wallet-adapter-react'
import NotificationCookieStore from '@store/notificationCookieStore'
import { useQueryClient } from '@tanstack/react-query'
import { Notification } from 'apis/notifications/notifications'
import { tryParse } from 'utils/formatting'
import { NotificationsWebSocket } from 'apis/notifications/websocket'

export function useToaster() {
  const isAuth = useIsAuthorized()
  const { publicKey } = useWallet()
  const token = NotificationCookieStore((s) => s.currentToken)
  const queryClient = useQueryClient()
  const criteria = publicKey?.toBase58() && token

  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [socketInterval, setSocketInterval] = useState<NodeJS.Timer | null>(
    null
  )

  useEffect(() => {
    if (socket) {
      socket.close()
      setSocketInterval(null)
    }
    let ws: WebSocket | null = null
    if (isAuth && publicKey) {
      const notificationWs = new NotificationsWebSocket(
        token,
        publicKey.toBase58()
      ).connect()
      ws = notificationWs.ws!

      ws.addEventListener('open', () => {
        // Send a ping message to the server every 10 seconds
        const interval = setInterval(() => {
          if (ws?.readyState === ws?.OPEN) {
            ws?.send('ping')
          }
        }, 30000)
        setSocketInterval(interval)
      })

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
            ['notifications', criteria],
            (prevData) => {
              if (!prevData) {
                return []
              }
              // Modify prevData with newData and return the updated data
              return [newNotification, ...prevData]
            }
          )
        }
      })

      ws.addEventListener('close', () => {
        if (socketInterval) {
          setSocketInterval(null)
        }
      })

      setSocket(ws)
    }

    // Clean up the WebSocket connection on unmount
    return () => {
      ws?.close()
      socket?.close()
      if (socketInterval) {
        setSocketInterval(null)
      }
    }
  }, [isAuth, publicKey?.toBase58(), token])
}
