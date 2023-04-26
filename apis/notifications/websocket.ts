import { NOTIFICATION_API_WEBSOCKET } from 'utils/constants'

export class NotificationsWebSocket {
  ws: WebSocket | null = null
  token: string
  publicKey: string

  constructor(token: string, publicKey: string) {
    this.token = token
    this.publicKey = publicKey
  }

  connect() {
    const wsUrl = new URL(NOTIFICATION_API_WEBSOCKET)
    wsUrl.searchParams.append('authorization', this.token)
    wsUrl.searchParams.append('publickey', this.publicKey)
    this.ws = new WebSocket(wsUrl)

    this.ws.addEventListener('open', () => {
      console.log('Notifications WebSocket opened')
    })

    this.ws.addEventListener('close', () => {
      console.log('Notifications WebSocket closed')
    })

    this.ws.addEventListener('error', (event) => {
      console.log('WebSocket error:', event)
    })
    return this
  }
}
