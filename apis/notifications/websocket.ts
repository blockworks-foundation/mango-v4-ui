import { NOTIFICATION_API_WEBSOCKET } from 'utils/constants'

export class NotificationsWebSocket {
  ws: WebSocket | null = null
  token: string
  mangoAccount: string
  publicKey: string
  pingInterval: number | null
  retryCount = 0
  maxRetries = 2

  constructor(token: string, publicKey: string, mangoAccount: string) {
    this.token = token
    this.publicKey = publicKey
    this.mangoAccount = mangoAccount
    this.pingInterval = null
  }

  connect() {
    const wsUrl = new URL(NOTIFICATION_API_WEBSOCKET)
    wsUrl.searchParams.append('authorization', this.token)
    wsUrl.searchParams.append('publickey', this.publicKey)
    wsUrl.searchParams.append('mangoAccount', this.mangoAccount)
    this.ws = new WebSocket(wsUrl)

    this.ws.addEventListener('open', () => {
      console.log('Notifications WebSocket opened')
      // Send a ping message to the server every 10 seconds
      const interval = window.setInterval(() => {
        if (this.ws?.readyState === this.ws?.OPEN) {
          this.ws?.send('ping')
        }
      }, 30000)
      this.pingInterval = interval
    })

    this.ws.addEventListener('close', (event: CloseEvent) => {
      console.log('Notifications WebSocket closed')
      this.handleClearSocketInterval()
      //1000 close form clinet
      //1008 unauthorized
      if (
        event.code !== 1000 &&
        event.code !== 1008 &&
        this.retryCount < this.maxRetries
      ) {
        this.retryCount++
        setTimeout(() => {
          this.connect()
        }, 5000)
      }
    })

    this.ws.addEventListener('error', (event) => {
      console.log('WebSocket error:', event)
    })
    return this
  }
  handleClearSocketInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }
}
