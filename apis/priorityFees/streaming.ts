/* eslint-disable @typescript-eslint/no-explicit-any */

export class PriorityFeesWebSocket {
  ws: WebSocket | null = null
//   token: string
//   mangoAccount: string
//   publicKey: string
//   pingInterval: number | null
  retryCount = 0
  maxRetries = 2

  constructor() {
    console.log('new')
    // this.token = token
    // this.publicKey = publicKey
    // this.mangoAccount = mangoAccount
    // this.pingInterval = null
  }

  connect() {
    this.ws = new WebSocket('wss://api.mngo.cloud/lite-rpc/v1/')

    this.ws.addEventListener('open', () => {
        console.log('[socket] Connected Block Priority Fees')
    })

    this.ws.addEventListener('close', (event: CloseEvent) => {
      console.log('Notifications WebSocket closed')
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
}


let subscriptionItem: any = {}

// 
// wscat --connect wss://api.mngo.cloud/lite-rpc/v1/
// {"jsonrpc": "2.0","id": 1,"method": "blockPrioritizationFeesSubscribe"}


