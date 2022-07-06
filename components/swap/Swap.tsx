import { useState, ChangeEvent, SelectHTMLAttributes } from 'react'
import { TransactionInstruction } from '@solana/web3.js'

import mangoStore from '../../store/state'
import ContentBox from '../shared/ContentBox'
import { notify } from '../../utils/notifications'
import JupiterRoutes from './JupiterRoutes'
import TokenSelect from '../TokenSelect'
import useDebounce from '../shared/useDebounce'

const numberFormat = new Intl.NumberFormat('en', {
  maximumSignificantDigits: 7,
})

const Swap = () => {
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState<number>()
  const [inputToken, setInputToken] = useState('SOL')
  const [outputToken, setOutputToken] = useState('USDC')
  const [submitting, setSubmitting] = useState(false)
  const [slippage, setSlippage] = useState(0.1)
  const debouncedAmountIn = useDebounce(amountIn, 300)

  const handleAmountInChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmountIn(e.target.value)
  }

  const handleTokenInSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    setInputToken(e.target.value)
  }

  const handleTokenOutSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    setOutputToken(e.target.value)
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
        outputToken: 'USDC',
        userDefinedInstructions,
      })
      console.log('Success swapping:', tx)
      // notify({
      //   title: 'Transaction confirmed',
      //   type: 'success',
      //   txid: tx,
      // })

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
        <div className="mt-1 flex justify-between rounded-md bg-th-bkg-1 py-2 px-6">
          <TokenSelect token={inputToken} onChange={handleTokenInSelect} />
          <div>
            <input
              type="text"
              name="amountIn"
              id="amountIn"
              className="tex-th-fgd-2 w-full rounded-lg border-none bg-transparent text-right text-2xl focus:ring-0"
              placeholder="0.00"
              value={amountIn}
              onChange={handleAmountInChange}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-md py-2 px-6">
          <TokenSelect token={outputToken} onChange={handleTokenOutSelect} />
          <div className="tex-th-fgd-2 w-full text-right text-2xl">
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
