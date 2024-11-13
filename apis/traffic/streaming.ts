/* eslint-disable @typescript-eslint/no-explicit-any */
import { SymbolInfo } from 'apis/datafeed'
import { getNextBarTime } from './helpers'

let subscriptionItem: any = {}

const socketUrl = 'wss://api.mngo.cloud/traffic/v1/recent-trades-ws'

const socket = new WebSocket(socketUrl)

socket.addEventListener('open', (_event) => {
  console.log('[socket] connected')
})

socket.addEventListener('message', (msg) => {
  const data = JSON.parse(msg.data)

  if (!data.TradeUpdate)
    return console.warn('[Socket Message] unexpected data:', data)

  if (data.TradeUpdate?.status === 'revoke') {
    return
  }

  const trade = data.TradeUpdate?.trade
  const currTime = trade.parse_time_ms
  const lastBar = subscriptionItem.lastBar

  if (
    trade.base_token_mint !== subscriptionItem.baseAddress ||
    trade.quote_token_mint !== subscriptionItem.quoteAddress
  )
    return

  const resolution = subscriptionItem.resolution
  const nextBarTime = getNextBarTime(lastBar, resolution)

  let bar

  if (currTime >= nextBarTime) {
    bar = {
      time: nextBarTime,
      open: trade.price,
      high: trade.price,
      low: trade.price,
      close: trade.price,
      volume: trade.price * trade.size,
    }
  } else {
    bar = {
      ...lastBar,
      high: Math.max(lastBar.high, trade.price),
      low: Math.min(lastBar.low, trade.price),
      close: trade.price,
      volume: lastBar.volume + trade.price * trade.size,
    }
  }

  subscriptionItem.lastBar = bar
  subscriptionItem.callback(bar)
})

export function subscribeOnStream(
  symbolInfo: SymbolInfo,
  resolution: any,
  onRealtimeCallback: any,
  onResetCacheNeededCallback: any,
  lastBar: any,
) {
  subscriptionItem = {
    resolution,
    lastBar,
    callback: onRealtimeCallback,
    baseAddress: symbolInfo.base_token,
    quoteAddress: symbolInfo.quote_token,
  }

  const subscriptionMessage = {
    command: 'subscribe',
    mintIds: [`${symbolInfo.base_token}-${symbolInfo.quote_token}`],
  }

  if (isOpen(socket)) {
    console.log(
      '[subscribeOnStream] Sending subscription:',
      subscriptionMessage,
    )
    socket.send(JSON.stringify(subscriptionMessage))
  } else {
    console.warn('[subscribeOnStream] socket closed, waiting to connect...')
    socket.addEventListener('open', () => {
      console.log(
        '[subscribeOnStream] socket opened, sending subscription:',
        subscriptionMessage,
      )
      socket.send(JSON.stringify(subscriptionMessage))
    })
  }
}

// export function unsubscribeFromStream(id: string) {
//   const subscriptionMessage = {
//     command: 'unsubscribe',
//     mintIds: [id],
//   }

//   if (isOpen(socket)) {
//     console.log('[unsubscribeFromStream] closing socket')
//     socket.send(JSON.stringify(subscriptionMessage))
//   } else {
//     console.warn('socket already closed')
//   }
// }

export function closeSocket() {
  if (isOpen(socket)) {
    console.log('[closeSocket] closing socket')
    socket.close()
  } else {
    console.warn('socket already closed')
  }
}

export function isOpen(ws?: WebSocket) {
  const sock = ws || socket
  return sock.readyState === WebSocket.OPEN
}
