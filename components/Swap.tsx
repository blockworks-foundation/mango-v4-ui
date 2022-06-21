import { useState, ChangeEvent } from 'react'
import { getOrcaOutputAmount } from '@blockworks-foundation/mango-v4'
import { useWallet } from '@solana/wallet-adapter-react'
import debounce from 'lodash.debounce'

import mangoStore, { connection } from '../store/state'
import Button from './shared/Button'
import Loading from './shared/Loading'
import ContentBox from './shared/ContentBox'

const Swap = () => {
  const [amountIn, setAmountIn] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [quoteOrcaAmountOut, setQuoteOrcaAmountOut] = useState(0)
  const { connected } = useWallet()

  const handleAmountInChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmountIn(e.target.value)
    debouncedGetOutAmount(e.target.value)
  }

  const debouncedGetOutAmount = debounce(async (amountIn) => {
    const x = await getOrcaOutputAmount(
      connection,
      'SOL',
      'ORCA',
      parseFloat(amountIn)
    )
    setQuoteOrcaAmountOut(x)
  }, 500)

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
      alert('Success! View browser console for tx id')

      await actions.reloadAccount()
      setSubmitting(false)
    } catch (e) {
      console.log('Error swapping:', e)
    }
  }

  return (
    <ContentBox>
      <div className="max-w-sm">
        <div className="mt-1 flex justify-between rounded-md bg-mango-600 py-2 px-6 drop-shadow-md">
          <div className="flex items-center">
            <label htmlFor="tokenIn" className="sr-only">
              Token
            </label>
            <select
              id="tokenIn"
              name="tokenIn"
              autoComplete="token"
              className="h-full rounded-md border-transparent bg-transparent pr-8 text-lg font-bold text-mango-200 focus:ring-0"
              // onChange={handleTokenSelect}
            >
              <option>SOL</option>
            </select>
          </div>
          <input
            type="text"
            name="amountIn"
            id="amountIn"
            className="rounded-lg border-none bg-transparent text-right text-2xl text-mango-200 focus:ring-0"
            placeholder="0.00"
            value={amountIn}
            onChange={handleAmountInChange}
          />
        </div>
        <div className="mt-4 flex justify-between rounded-md bg-mango-600 py-2 px-6 drop-shadow-md">
          <div className="flex items-center">
            <label htmlFor="tokenOut" className="sr-only">
              Token
            </label>
            <select
              id="tokenOut"
              name="tokenOut"
              autoComplete="token"
              className="h-full rounded-md border-transparent bg-transparent pr-8 text-lg font-bold text-mango-200 focus:ring-0"
              // onChange={handleTokenSelect}
            >
              <option>ORCA</option>
            </select>
          </div>
          <input
            type="text"
            name="amountOut"
            id="amountOut"
            className="rounded-lg border-none bg-transparent text-right text-2xl text-mango-200 focus:ring-0"
            disabled
          />
        </div>
      </div>
      {quoteOrcaAmountOut ? (
        <div className="mt-4">
          <div className="flex">
            <div className="mx-auto">Routes:</div>
          </div>
          <div className="mt-1 space-y-4">
            <div className="flex justify-between rounded border border-orange-400 p-4">
              <div>Orca</div>
              <div>{quoteOrcaAmountOut}</div>
            </div>
            <div className="flex justify-between rounded border border-orange-400 p-4">
              <div>Serum</div>
              <div>0.00</div>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mt-4 flex justify-center">
        <Button
          onClick={handleSwap}
          className="flex items-center"
          disabled={!connected}
        >
          {submitting ? <Loading className="mr-2 h-5 w-5" /> : null} Swap
        </Button>
      </div>
    </ContentBox>
  )
}

export default Swap
