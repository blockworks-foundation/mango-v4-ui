import mangoStore from '@store/mangoStore'
import { OrderbookL2, isMangoError } from 'types'
import { notify } from './notifications'
import * as sentry from '@sentry/nextjs'
import { Bank } from '@blockworks-foundation/mango-v4'

export const calculateLimitPriceForMarketOrder = (
  orderBook: OrderbookL2,
  size: number,
  side: 'buy' | 'sell',
): number => {
  const orders = side === 'buy' ? orderBook.asks : orderBook.bids
  let acc = 0
  let selectedOrder
  const orderSize = size
  for (const order of orders) {
    acc += order[1]
    if (acc >= orderSize) {
      selectedOrder = order
      break
    }
  }

  if (!selectedOrder) {
    throw new Error(
      'Unable to place market order for this order size. Please retry.',
    )
  }

  if (side === 'buy') {
    return selectedOrder[0] * 1.05
  } else {
    return selectedOrder[0] * 0.95
  }
}

export const calculateEstPriceForBaseSize = (
  orderBook: OrderbookL2,
  size: number,
  side: 'buy' | 'sell',
): number => {
  const orders = side === 'buy' ? orderBook.asks : orderBook.bids
  let acc = 0
  let selectedOrder
  const orderSize = size
  for (const order of orders) {
    acc += order[1]
    if (acc >= orderSize) {
      selectedOrder = order
      break
    }
  }

  if (!selectedOrder) {
    throw new Error('Unable to calculate market order. Please retry.')
  }

  if (side === 'buy') {
    return selectedOrder[0]
  } else {
    return selectedOrder[0]
  }
}

export const calculateSlippage = (
  orderBook: OrderbookL2,
  size: number,
  side: 'buy' | 'sell',
  markPrice: number,
): number => {
  const bb = orderBook?.bids?.length > 0 && Number(orderBook.bids[0][0])
  const ba = orderBook?.asks?.length > 0 && Number(orderBook.asks[0][0])
  const referencePrice = bb && ba ? (bb + ba) / 2 : markPrice

  if (Number(size)) {
    const estimatedPrice = calculateEstPriceForBaseSize(
      orderBook,
      Number(size),
      side,
    )

    const slippageAbs =
      Number(size) > 0 ? Math.abs(estimatedPrice - referencePrice) : 0

    const slippageRel = (slippageAbs / referencePrice) * 100
    return slippageRel
  }
  return 0
}

export const handlePlaceTriggerOrder = async (
  positionBank: Bank | undefined,
  quoteBank: Bank | undefined,
  amountIn: number,
  triggerPrice: string,
  orderType: TriggerOrderTypes,
  isReducingShort: boolean,
  flipPrices: boolean,
  setSubmitting: (s: boolean) => void,
) => {
  try {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const mangoAccount = mangoStore.getState().mangoAccount.current
    // const inputBank = mangoStore.getState().swap.inputBank
    // const outputBank = mangoStore.getState().swap.outputBank

    if (!mangoAccount || !group || !positionBank || !quoteBank || !triggerPrice)
      return
    setSubmitting(true)

    // const amountIn = amountInAsDecimal.toNumber()

    const isReduceLong = !isReducingShort

    try {
      let tx
      if (orderType === TriggerOrderTypes.STOP_LOSS) {
        if (isReduceLong) {
          tx = await client.tcsStopLossOnDeposit(
            group,
            mangoAccount,
            positionBank,
            quoteBank,
            parseFloat(triggerPrice),
            flipPrices,
            amountIn,
            null,
            null,
          )
        } else {
          tx = await client.tcsStopLossOnBorrow(
            group,
            mangoAccount,
            quoteBank,
            positionBank,
            parseFloat(triggerPrice),
            !flipPrices,
            amountIn,
            null,
            true,
            null,
          )
        }
      }
      if (orderType === TriggerOrderTypes.TAKE_PROFIT) {
        if (isReduceLong) {
          tx = await client.tcsTakeProfitOnDeposit(
            group,
            mangoAccount,
            positionBank,
            quoteBank,
            parseFloat(triggerPrice),
            flipPrices,
            amountIn,
            null,
            null,
          )
        } else {
          tx = await client.tcsTakeProfitOnBorrow(
            group,
            mangoAccount,
            quoteBank,
            positionBank,
            parseFloat(triggerPrice),
            !flipPrices,
            amountIn,
            null,
            true,
            null,
          )
        }
      }
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx?.signature,
        noSound: true,
      })
      actions.fetchGroup()
      await actions.reloadMangoAccount(tx?.slot)
    } catch (e) {
      console.error('onSwap error: ', e)
      sentry.captureException(e)
      if (isMangoError(e)) {
        notify({
          title: 'Transaction failed',
          description: e.message,
          txid: e?.txid,
          type: 'error',
        })
      }
    }
  } catch (e) {
    console.error('Swap error:', e)
  } finally {
    setSubmitting(false)
  }
}

export enum OrderTypes {
  LIMIT = 'Limit',
  MARKET = 'Market',
}

export enum TriggerOrderTypes {
  STOP_LOSS = 'trade:stop-loss',
  TAKE_PROFIT = 'trade:take-profit',
}
