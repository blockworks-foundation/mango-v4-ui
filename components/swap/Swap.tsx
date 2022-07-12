import { useState, ChangeEvent } from 'react'
import { TransactionInstruction } from '@solana/web3.js'
import { ArrowDownIcon, SwitchVerticalIcon } from '@heroicons/react/solid'

import mangoStore from '../../store/state'
import ContentBox from '../shared/ContentBox'
import { notify } from '../../utils/notifications'
import JupiterRoutes from './JupiterRoutes'
import TokenSelect from '../TokenSelect'
import useDebounce from '../shared/useDebounce'
import { numberFormat } from '../../utils/numbers'

const Swap = () => {
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState<number>()
  const [inputToken, setInputToken] = useState('SOL')
  const [outputToken, setOutputToken] = useState('USDC')
  const [submitting, setSubmitting] = useState(false)
  const [slippage, setSlippage] = useState(0.1)
  const debouncedAmountIn = useDebounce(amountIn, 300)
  const set = mangoStore.getState().set
  const tokens = mangoStore((s) => s.jupiterTokens)

  const handleAmountInChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmountIn(e.target.value)
  }

  const handleTokenInSelect = (symbol: string) => {
    const inputTokenInfo = tokens.find((t: any) => t.symbol === symbol)
    set((s) => {
      s.inputTokenInfo = inputTokenInfo
    })
    setInputToken(symbol)
  }

  const handleTokenOutSelect = (symbol: string) => {
    const outputTokenInfo = tokens.find((t: any) => t.symbol === symbol)
    set((s) => {
      s.outputTokenInfo = outputTokenInfo
    })
    setOutputToken(symbol)
  }

  const handleSwitchTokens = () => {
    const inputTokenInfo = tokens.find((t: any) => t.symbol === inputToken)
    const outputTokenInfo = tokens.find((t: any) => t.symbol === outputToken)
    set((s) => {
      s.inputTokenInfo = outputTokenInfo
      s.outputTokenInfo = inputTokenInfo
    })
    setInputToken(outputToken)
    setOutputToken(inputToken)
  }

  const handleSwap = async (
    userDefinedInstructions: TransactionInstruction[]
  ) => {
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
        outputToken,
        userDefinedInstructions,
      })
      console.log('Success swapping:', tx)
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
      })

      await actions.reloadAccount()
    } catch (e: any) {
      console.log('Error swapping:', e)
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ContentBox className="max-w-md">
      <div className="">
        <div className="mt-1 flex-col rounded-md bg-th-bkg-1 py-2 px-6">
          <div className="flex items-center justify-between">
            <TokenSelect token={inputToken} onChange={handleTokenInSelect} />
            <div>
              <input
                type="text"
                name="amountIn"
                id="amountIn"
                className="w-full rounded-lg border-none bg-transparent text-right text-2xl text-th-fgd-3 focus:outline-none"
                placeholder="0.00"
                value={amountIn}
                onChange={handleAmountInChange}
              />
            </div>
          </div>
          <div className="mb-1">
            <label
              htmlFor="default-range"
              className="block text-sm font-medium text-gray-900 dark:text-gray-300"
            ></label>
            <input
              id="default-range"
              type="range"
              className="mb-6 h-1 w-full cursor-pointer appearance-none rounded-lg bg-th-bkg-3"
            ></input>
          </div>
        </div>
        <div className="-my-5 flex justify-center">
          <button onClick={handleSwitchTokens}>
            <ArrowDownIcon className="h-10 w-10 rounded-full border-4 border-th-bkg-1 bg-th-bkg-2 p-1.5 text-th-fgd-3 md:hover:text-th-primary" />
            {/* <SwitchVerticalIcon className="default-transition h-10 w-10 rounded-full border-4 border-th-bkg-1 bg-th-bkg-2 p-1.5 text-th-fgd-3 md:hover:text-th-primary" /> */}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between py-2 px-6">
          <TokenSelect token={outputToken} onChange={handleTokenOutSelect} />
          <div className="w-full cursor-context-menu text-right text-2xl text-th-fgd-3">
            {amountOut ? numberFormat.format(amountOut) : null}
          </div>
        </div>
      </div>

      <JupiterRoutes
        inputToken={inputToken}
        outputToken={outputToken}
        amountIn={parseFloat(debouncedAmountIn)}
        slippage={slippage}
        handleSwap={handleSwap}
        submitting={submitting}
        setAmountOut={setAmountOut}
      />
    </ContentBox>
  )
}

export default Swap
