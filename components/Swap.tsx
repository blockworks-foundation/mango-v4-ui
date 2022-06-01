import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import mangoStore from '../store/state'
import Button from './shared/Button'
import Loading from './shared/Loading'

const Swap = () => {
  const [amountIn, setAmountIn] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { connected } = useWallet()

  const handleSwap = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const mangoAccount = mangoStore.getState().mangoAccount
    if (!mangoAccount || !group) return

    try {
      setSubmitting(true)
      const tx = await client.marginTrade({
        group,
        mangoAccount,
        inputToken: 'SOL',
        amountIn: parseFloat(amountIn),
        outputToken: 'ORCA',
        minimumAmountOut: parseFloat('0.00'),
      })
      console.log('Success swapping:', tx)

      await actions.reloadAccount()
      setSubmitting(false)
    } catch (e) {
      console.log('Error swapping:', e)
    }
  }

  if (!connected) return null

  return (
    <div className="rounded border-8 p-4">
      <div>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 flex items-center">
            <label htmlFor="token" className="sr-only">
              Token
            </label>
            <select
              id="token"
              name="token"
              autoComplete="token"
              className="h-full rounded-md border-transparent bg-transparent py-0 pl-3 pr-7 text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              // onChange={handleTokenSelect}
            >
              <option>SOL</option>
            </select>
          </div>
          <input
            type="text"
            name="amountIn"
            id="amountIn"
            className="block w-full rounded-md border-gray-300 pl-24 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.00"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
          />
        </div>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 flex items-center">
            <label htmlFor="token" className="sr-only">
              Token
            </label>
            <select
              id="token"
              name="token"
              autoComplete="token"
              className="h-full rounded-md border-transparent bg-transparent py-0 pl-3 pr-7 text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              // onChange={handleTokenSelect}
            >
              <option>ORCA</option>
            </select>
          </div>
          <input
            type="text"
            name="amountOut"
            id="amountOut"
            className="block w-full rounded-md border-gray-300 pl-24 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.00"
            disabled
          />
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <Button onClick={handleSwap} className="flex items-center">
          {submitting ? <Loading className="mr-2 h-5 w-5" /> : null} Swap
        </Button>
      </div>
    </div>
  )
}

export default Swap
