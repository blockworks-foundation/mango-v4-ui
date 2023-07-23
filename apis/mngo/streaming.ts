/* eslint-disable @typescript-eslint/no-explicit-any */
import { FillsFeed } from '@blockworks-foundation/mango-feeds'
import { getNextBarTime } from './helpers'
import mangoStore from '@store/mangoStore'

let subscriptionItem: any = {}

const fillsFeed = new FillsFeed(`wss://api.mngo.cloud/fills/v1/`, {
  reconnectionIntervalMs: 10_000,
  reconnectionMaxAttempts: 60,
})

fillsFeed.onConnect(() => {
  console.log('[FillsFeed] Connected')
})
fillsFeed.onDisconnect(() => {
  console.log('[FillsFeed] Disconnected, retrying...')
})
fillsFeed.onFill((update) => {
  const marketName = mangoStore.getState().selectedMarket.name
  if (update.status == 'revoke' || update.marketName != marketName) {
    return
  }

  const currTime = new Date(update.event.timestamp).getTime()
  const lastBar = subscriptionItem.lastBar
  const resolution = subscriptionItem.resolution
  const nextBarTime = getNextBarTime(lastBar, resolution)
  const price = update.event.price
  const size = update.event.quantity
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
  lastBar: any,
) {
  subscriptionItem = {
    resolution,
    lastBar,
    callback: onRealtimeCallback,
  }
  if (!fillsFeed.connected()) {
    return
  }
  console.log('[FillsFeed] subscribe', subscriberUID)
  fillsFeed.subscribe({ marketId: symbolInfo.address })
}

export function unsubscribeFromStream(subscriberUID: string) {
  setTimeout(() => {
    const marketAddress = subscriberUID.split('_')[0]
    if (!fillsFeed.connected()) {
      return
    }
    console.warn('[FillsFeed] unsubscribe', subscriberUID)
    fillsFeed.unsubscribe(marketAddress)
  }, 5000)
}

export function closeSocket() {
  fillsFeed.disconnect()
}

export function isOpen(ws?: WebSocket): ws is WebSocket {
  return fillsFeed.connected()
}
