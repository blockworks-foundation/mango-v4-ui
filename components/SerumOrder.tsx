import {
  DEVNET_SERUM3_PROGRAM_ID,
  Serum3OrderType,
  Serum3SelfTradeBehavior,
  Serum3Side,
} from '@blockworks-foundation/mango-v4'
import { Order } from '@project-serum/serum/lib/market'
import { useState } from 'react'
import mangoStore from '../store/state'
import Button from './shared/Button'
import ContentBox from './shared/ContentBox'
import ExplorerLink from './shared/ExplorerLink'

const SerumOrder = () => {
  const markets = mangoStore((s) => s.markets)
  const serumOrders = mangoStore((s) => s.serumOrders)
  const actions = mangoStore.getState().actions
  const mangoAccount = mangoStore.getState().mangoAccount

  const [tradeForm, setTradeForm] = useState({ side: '', size: '', price: '' })

  const handlePlaceOrder = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount

    if (!group || !mangoAccount) return

    try {
      const side = tradeForm.side === 'buy' ? Serum3Side.bid : Serum3Side.ask

      const tx = await client.serum3PlaceOrder(
        group,
        mangoAccount,
        DEVNET_SERUM3_PROGRAM_ID,
        'BTC/USDC',
        side,
        parseFloat(tradeForm.price),
        parseFloat(tradeForm.size),
        Serum3SelfTradeBehavior.decrementTake,
        Serum3OrderType.limit,
        Date.now(),
        10
      )
      console.log('tx', tx)
      actions.reloadAccount()
      actions.loadSerumMarket()
    } catch (e) {
      console.log('Error placing order:', e)
    }
  }

  const cancelOrder = async (order: Order) => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount

    if (!group || !mangoAccount) return

    try {
      const tx = await client.serum3CancelOrder(
        group,
        mangoAccount,
        DEVNET_SERUM3_PROGRAM_ID,
        'BTC/USDC',
        order.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
        order.orderId
      )
      actions.reloadAccount()
      actions.loadSerumMarket()
      console.log('tx', tx)
    } catch (e) {
      console.log('error cancelling order', e)
    }
  }

  return (
    <ContentBox>
      Serum 3
      {markets?.length ? (
        <div className="rounded border border-mango-500 p-4">
          {markets?.map((m) => {
            return (
              <div key={m.name}>
                <div>
                  {m.name}: <ExplorerLink address={m.publicKey.toString()} />
                </div>
                <div>Market Index: {m.marketIndex}</div>
                <div>
                  {serumOrders?.map((o) => {
                    const ooAddress = o.openOrdersAddress
                    const myOrder = mangoAccount?.serum3
                      .map((s) => s.openOrders.toString())
                      .includes(ooAddress.toString())

                    return (
                      <div
                        key={`${o.side}${o.size}${o.price}`}
                        className="my-1 rounded border p-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div>Side: {o.side}</div>
                            <div>Size: {o.size}</div>
                            <div>Price: {o.price}</div>
                          </div>
                          {myOrder ? (
                            <div>
                              <Button onClick={() => cancelOrder(o)}>
                                Cancel
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
      <form className="mt-4">
        <div className="mt-2">
          <label
            htmlFor="side"
            className="block text-sm font-medium text-mango-300"
          >
            Side
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="side"
              id="side"
              className="block w-full rounded-md border-none bg-mango-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="buy"
              value={tradeForm.side}
              onChange={(e) =>
                setTradeForm((prevState) => ({
                  ...prevState,
                  side: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="mt-2">
          <label
            htmlFor="size"
            className="block text-sm font-medium text-mango-300"
          >
            Size
          </label>
          <div className="mt-1">
            <input
              type="number"
              name="size"
              id="size"
              className="block w-full rounded-md border-none bg-mango-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0.00"
              value={tradeForm.size}
              onChange={(e) =>
                setTradeForm((prevState) => ({
                  ...prevState,
                  size: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="mt-2">
          <label
            htmlFor="price"
            className="block text-sm font-medium text-mango-300"
          >
            Price
          </label>
          <div className="mt-1">
            <input
              type="number"
              name="price"
              id="price"
              className="block w-full rounded-md border-none bg-mango-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0.00"
              value={tradeForm.price}
              onChange={(e) =>
                setTradeForm((prevState) => ({
                  ...prevState,
                  price: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </form>
      <div className="mt-4 flex justify-center">
        <Button onClick={handlePlaceOrder}>Place Order</Button>
      </div>
    </ContentBox>
  )
}

export default SerumOrder
