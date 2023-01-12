import {
  parseResolution,
  getNextBarTime,
  NEXT_PUBLIC_BIRDEYE_API_KEY,
} from './helpers'

let subscriptionItem: any = {}

// Create WebSocket connection.
const socket = new WebSocket(
  `wss://public-api.birdeye.so/socket?x-api-key=${NEXT_PUBLIC_BIRDEYE_API_KEY}`,
  'echo-protocol'
)

// Connection opened
socket.addEventListener('open', (_event) => {
  console.log('[socket] Connected')
})

// Listen for messages
socket.addEventListener('message', (msg) => {
  const data = JSON.parse(msg.data)

  if (data.type !== 'PRICE_DATA') return console.log(data)

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
    // console.log('[socket] Generate new bar')
  } else {
    bar = {
      ...lastBar,
      high: Math.max(lastBar.high, data.data.h),
      low: Math.min(lastBar.low, data.data.l),
      close: data.data.c,
      volume: data.data.v,
    }
    // console.log('[socket] Update the latest bar by price')
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

  socket.send(JSON.stringify(msg))
}

export function unsubscribeFromStream() {
  const msg = {
    type: 'UNSUBSCRIBE_PRICE',
  }

  socket.send(JSON.stringify(msg))
}
