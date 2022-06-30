import { useState, ChangeEvent } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import Image from 'next/image'

import mangoStore from '../store/state'
import Button from './shared/Button'
import Loading from './shared/Loading'
import ContentBox from './shared/ContentBox'

const Swap = () => {
  const [amountIn, setAmountIn] = useState('')
  const [inputToken, setInputToken] = useState('SOL')
  const [outputToken, setOutputToken] = useState('USDC')
  const [submitting, setSubmitting] = useState(false)
  const [quoteOrcaAmountOut, setQuoteOrcaAmountOut] = useState(0)
  const { connected } = useWallet()

  const handleAmountInChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmountIn(e.target.value)
  }

  const handleTokenInSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    setInputToken(e.target.value)
  }

  const handleTokenOutSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    setOutputToken(e.target.value)
  }

  const handleSwap = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const mangoAccount = mangoStore.getState().mangoAccount
    if (!mangoAccount || !group) return

    try {
      setSubmitting(true)
      const tx = await client.marginTrade3({
        group,
        mangoAccount,
        inputToken,
        amountIn: parseFloat(amountIn),
        outputToken: 'USDC',
        slippage: 0.5,
      })
      console.log('Success swapping:', tx)
      alert('Success! View browser console for tx id')

      await actions.reloadAccount()
    } catch (e) {
      // @ts-ignore
      console.log('Error swapping:', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ContentBox>
      <div className="max-w-sm">
        <div className="mt-1 flex justify-between rounded-md bg-mango-600 py-2 px-6 drop-shadow-md">
          <div className="flex items-center">
            <div className="flex min-w-[24px] items-center">
              <Image
                alt=""
                width="30"
                height="30"
                src={`/icons/${inputToken.toLowerCase()}.svg`}
              />
            </div>
            <label htmlFor="tokenIn" className="sr-only">
              Token
            </label>
            <select
              id="tokenIn"
              name="tokenIn"
              autoComplete="token"
              className="h-full rounded-md border-transparent bg-transparent pr-10 text-lg font-bold text-mango-200 focus:ring-0"
              onChange={handleTokenInSelect}
            >
              <option>SOL</option>
              <option>BTC</option>
              <option>USDC</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              name="amountIn"
              id="amountIn"
              className="w-full rounded-lg border-none bg-transparent text-right text-2xl text-mango-200 focus:ring-0"
              placeholder="0.00"
              value={amountIn}
              onChange={handleAmountInChange}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-between rounded-md bg-mango-600 py-2 px-6 drop-shadow-md">
          <div className="flex items-center">
            <div className="flex min-w-[24px] items-center">
              <Image
                alt=""
                width="30"
                height="30"
                src={`/icons/${outputToken.toLowerCase()}.svg`}
              />
            </div>
            <label htmlFor="tokenOut" className="sr-only">
              Token
            </label>
            <select
              id="tokenOut"
              name="tokenOut"
              autoComplete="token"
              className="h-full rounded-md border-transparent bg-transparent pr-10 text-lg font-bold text-mango-200 focus:ring-0"
              onChange={handleTokenOutSelect}
            >
              <option>USDC</option>
              <option>SOL</option>
              <option>BTC</option>
            </select>
          </div>
          <input
            type="text"
            name="amountOut"
            id="amountOut"
            className="w-full rounded-lg border-none bg-transparent text-right text-2xl text-mango-200 focus:ring-0"
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
