import { useEffect, useState } from 'react'
import { notify } from 'utils/notifications'
import { useIsAuthorized } from './useIsAuthorized'
import { useWallet } from '@solana/wallet-adapter-react'
import NotificationCookieStore from '@store/notificationCookieStore'
import { NOTIFICATION_API_WEBSOCKET } from 'utils/constants'
import { useQueryClient } from '@tanstack/react-query'
import { Notification } from 'apis/notifications'

export function useToaster() {
  const isAuth = useIsAuthorized()
  const { publicKey } = useWallet()
  const token = NotificationCookieStore((s) => s.currentToken)
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const criteria = publicKey?.toBase58() && token

  useEffect(() => {
    if (socket) {
      socket.close()
    }

    if (isAuth && publicKey) {
      // Change the URL to your WebSocket server URL
      const wsUrl = new URL(NOTIFICATION_API_WEBSOCKET)
      wsUrl.searchParams.append('authorization', token)
      wsUrl.searchParams.append('publickey', publicKey!.toBase58())

      const ws = new WebSocket(wsUrl)

      ws.addEventListener('open', () => {
        console.log('Notifications WebSocket connected')
      })

      ws.addEventListener('message', (event) => {
        const newNotification = JSON.parse(event.data) as Notification
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
      })

      ws.addEventListener('close', (ev) => {
        console.log('Notifications WebSocket disconnected', ev)
      })

      ws.addEventListener('error', (error) => {
        console.log('Notifications WebSocket error:', error)
      })
      setSocket(ws)
      // Clean up the WebSocket connection on unmount
      return () => {
        ws.close()
      }
    }
  }, [isAuth, publicKey?.toBase58(), token])
}
