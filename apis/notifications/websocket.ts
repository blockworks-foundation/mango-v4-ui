import { NOTIFICATION_API_WEBSOCKET } from 'utils/constants'

export class NotificationsWebSocket {
  ws: WebSocket | null = null
  token: string
  publicKey: string
  pingInterval: NodeJS.Timer | null

  constructor(token: string, publicKey: string) {
    this.token = token
    this.publicKey = publicKey
    this.pingInterval = null
  }

  connect() {
    const wsUrl = new URL(NOTIFICATION_API_WEBSOCKET)
    wsUrl.searchParams.append('authorization', this.token)
    wsUrl.searchParams.append('publickey', this.publicKey)
    this.ws = new WebSocket(wsUrl)

    this.ws.addEventListener('open', () => {
      console.log('Notifications WebSocket opened')
      // Send a ping message to the server every 10 seconds
      const interval = setInterval(() => {
        if (this.ws?.readyState === this.ws?.OPEN) {
          this.ws?.send('ping')
        }
      }, 30000)
      this.pingInterval = interval
    })

    this.ws.addEventListener('close', () => {
      console.log('Notifications WebSocket closed')
      this.handleClearSocketInterval()
    })

    this.ws.addEventListener('error', (event) => {
      console.log('WebSocket error:', event)
    })
    return this
  }
  handleClearSocketInterval() {
    console.log('clear interval')
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }
}
