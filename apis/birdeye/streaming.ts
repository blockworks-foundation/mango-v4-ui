/* eslint-disable @typescript-eslint/no-explicit-any */
import { parseResolution, getNextBarTime, socketUrl } from './helpers'

let subscriptionItem: any = {}

// Create WebSocket connection.
const socket = new WebSocket(socketUrl, 'echo-protocol')

// Connection opened
socket.addEventListener('open', (_event) => {
  console.log('[socket] Connected birdeye')
})

// Listen for messages
socket.addEventListener('message', (msg) => {
  const data = JSON.parse(msg.data)
  if (data.type !== 'PRICE_DATA') return console.warn(data)

  const currTime = data.data.unixTime * 1000
  const lastBar = subscriptionItem.lastBar
  const resolution = subscriptionItem.resolution
  const nextBarTime = getNextBarTime(lastBar, resolution)

  let bar
  if (currTime >= nextBarTime) {
    bar = {
      time: nextBarTime,
      open: data.data.o,
      high: data.data.h,
      low: data.data.l,
      close: data.data.c,
      volume: data.data.v,
    }
  } else {
    bar = {
      ...lastBar,
      high: Math.max(lastBar.high, data.data.h),
      low: Math.min(lastBar.low, data.data.l),
      close: data.data.c,
      volume: data.data.v,
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
    type: 'SUBSCRIBE_PRICE',
    data: {
      chartType: parseResolution(resolution),
      address: symbolInfo.address,
      currency: symbolInfo.type || 'usd',
    },
  }
  if (!isOpen(socket)) {
    console.warn('Socket Closed')
    socket.addEventListener('open', (_event) => {
      socket.send(JSON.stringify(msg))
    })
    return
  }
  console.warn('[subscribeBars birdeye]')
  socket.send(JSON.stringify(msg))
}

export function unsubscribeFromStream() {
  const msg = {
    type: 'UNSUBSCRIBE_PRICE',
  }

  if (!isOpen(socket)) {
    console.warn('Socket Closed')
    return
  }
  console.warn('[unsubscribeBars birdeye]')
  socket.send(JSON.stringify(msg))
}

export function closeSocket() {
  if (!isOpen(socket)) {
    console.warn('Socket Closed birdeye')
    return
  }
  console.warn('[closeSocket birdeye]')
  socket.close()
}

export function isOpen(ws?: WebSocket) {
  const sock = ws || socket
  return sock.readyState === sock.OPEN
}
