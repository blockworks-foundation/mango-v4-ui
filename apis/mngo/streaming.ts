/* eslint-disable @typescript-eslint/no-explicit-any */
import { getNextBarTime } from './helpers'
import mangoStore from '@store/mangoStore'

let subscriptionItem: any = {}

// Create WebSocket connection.
const socket = new WebSocket(`wss://api.mngo.cloud/fills/v1/`)

// Connection opened
socket.addEventListener('open', (_event) => {
  console.log('[socket] Connected mngo')
})

// Listen for messages
socket.addEventListener('message', (msg) => {
  const data = JSON.parse(msg.data)

  if (!data.event) return console.warn(data)
  if (data.event.maker) return
  if (data.event.marketId != mangoStore.getState().selectedMarket) return
  const currTime = new Date(data.event.timestamp).getTime()
  const lastBar = subscriptionItem.lastBar
  const resolution = subscriptionItem.resolution
  const nextBarTime = getNextBarTime(lastBar, resolution)
  const price = data.event.price
  const size = data.event.quantity
  let bar

  if (currTime >= nextBarTime) {
    bar = {
      time: nextBarTime,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: size,
    }
  } else {
    bar = {
      ...lastBar,
      high: Math.max(lastBar.high, price),
      low: Math.min(lastBar.low, price),
      close: price,
      volume: lastBar.volume + size,
    }
  }

  subscriptionItem.lastBar = bar
  subscriptionItem.callback(bar)
})

export function subscribeOnStream(
  symbolInfo: any,
  resolution: any,
  onRealtimeCallback: any,
  subscriberUID: any,
  onResetCacheNeededCallback: any,
  lastBar: any
) {
  subscriptionItem = {
    resolution,
    lastBar,
    callback: onRealtimeCallback,
  }

  const msg = {
    command: 'subscribe',
    marketId: symbolInfo.address,
  }
  if (!isOpen(socket)) {
    console.warn('Socket Closed')
    return
  }
  console.warn('[subscribeOnStream mngo]', subscriberUID)
  socket.send(JSON.stringify(msg))
}

export function unsubscribeFromStream(uid: string) {
  const msg = {
    command: 'unsubscribe',
    marketId: uid.split('_')[0],
  }
  if (!isOpen(socket)) {
    console.warn('Socket Closed')
    return
  }
  console.warn('[unsubscribeFromStream mngo]', uid)
  socket.send(JSON.stringify(msg))
}

export function closeSocket() {
  if (!isOpen(socket)) {
    console.warn('Socket Closed mngo')
    return
  }
  console.warn('[closeSocket mngo]')
  socket.close()
}

export function isOpen(ws?: WebSocket) {
  const sock = ws || socket
  return sock.readyState === sock.OPEN
}
