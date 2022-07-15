import { useState, ChangeEvent, useCallback } from 'react'
import { TransactionInstruction } from '@solana/web3.js'
import { ArrowDownIcon } from '@heroicons/react/solid'

import mangoStore from '../../store/state'
import ContentBox from '../shared/ContentBox'
import { notify } from '../../utils/notifications'
import JupiterRoutes from './JupiterRoutes'
import TokenSelect from '../TokenSelect'
import useDebounce from '../shared/useDebounce'
import { numberFormat } from '../../utils/numbers'
import LeverageSlider from './LeverageSlider'
import Input from '../forms/Input'
import { useTranslation } from 'next-i18next'

const Swap = () => {
  const { t } = useTranslation('common')
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState<number>()
  const [inputToken, setInputToken] = useState('SOL')
  const [outputToken, setOutputToken] = useState('USDC')
  const [submitting, setSubmitting] = useState(false)
  const [slippage, setSlippage] = useState(0.1)
  const debouncedAmountIn = useDebounce(amountIn, 400)
  const set = mangoStore.getState().set
  const tokens = mangoStore((s) => s.jupiterTokens)

  const handleAmountInChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setAmountIn(e.target.value)
    },
    []
  )

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
    <ContentBox showBackground>
      <p className="mb-2 text-th-fgd-3">{t('short')}</p>
      <div className="mb-3 grid grid-cols-2">
        <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-3 bg-th-bkg-1 px-4">
          <TokenSelect token={inputToken} onChange={handleTokenInSelect} />
        </div>
        <div className="col-span-1">
          <Input
            type="text"
            name="amountIn"
            id="amountIn"
            className="w-full rounded-lg rounded-l-none border border-th-bkg-3 bg-th-bkg-1 py-3 px-4 text-right text-xl font-bold tracking-wider text-th-fgd-1 focus:outline-none"
            placeholder="0.00"
            value={amountIn}
            onChange={handleAmountInChange}
          />
        </div>
      </div>
      <div className="flex justify-center">
        <button
          className="rounded-full border border-th-bkg-4 p-1.5 text-th-fgd-3 md:hover:text-th-primary"
          onClick={handleSwitchTokens}
        >
          <ArrowDownIcon className="h-5 w-5" />
        </button>
      </div>
      <p className="mb-2 text-th-fgd-3">{t('long')}</p>
      <div className="mb-3 grid grid-cols-2">
        <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-3 bg-th-bkg-1 px-4">
          <TokenSelect token={outputToken} onChange={handleTokenOutSelect} />
        </div>
        <div className="w-full rounded-lg rounded-l-none border border-th-bkg-3 bg-th-bkg-3 py-3 px-4 text-right text-xl font-bold tracking-wider text-th-fgd-3">
          {amountOut ? numberFormat.format(amountOut) : 0}
        </div>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-th-fgd-3">{t('leverage')}</p>
        <p className="font-bold text-th-fgd-1">0.00x</p>
      </div>
      <LeverageSlider
        inputToken={inputToken}
        outputToken={outputToken}
        onChange={(x) => setAmountIn(x)}
      />
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
