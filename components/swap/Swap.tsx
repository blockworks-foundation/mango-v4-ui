import { useState, ChangeEvent, useCallback, Fragment, useEffect } from 'react'
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
import SelectToken from './SelectToken'
import { Transition } from '@headlessui/react'

const Swap = () => {
  const { t } = useTranslation('common')
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState<number>()
  const [inputToken, setInputToken] = useState('SOL')
  const [outputToken, setOutputToken] = useState('USDC')
  const [submitting, setSubmitting] = useState(false)
  const [animateSwtichArrow, setAnimateSwitchArrow] = useState(0)
  const [showTokenSelect, setShowTokenSelect] = useState('')
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
    setShowTokenSelect('')
  }

  const handleTokenOutSelect = (symbol: string) => {
    const outputTokenInfo = tokens.find((t: any) => t.symbol === symbol)
    set((s) => {
      s.outputTokenInfo = outputTokenInfo
    })
    setOutputToken(symbol)
    setShowTokenSelect('')
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

    setAnimateSwitchArrow(animateSwtichArrow + 1)
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
    <ContentBox showBackground className="relative">
      <Transition
        appear={true}
        className="thin-scroll absolute bottom-0 left-0 z-20 h-full overflow-auto bg-th-bkg-2 p-6 pb-0"
        show={!!showTokenSelect}
        enter="transition-all ease-in duration-500"
        enterFrom="max-h-0"
        enterTo="max-h-full"
        leave="transition-all ease-out duration-500"
        leaveFrom="max-h-full"
        leaveTo="max-h-0"
      >
        <SelectToken
          onClose={() => setShowTokenSelect('')}
          onTokenSelect={
            showTokenSelect === 'input'
              ? handleTokenInSelect
              : handleTokenOutSelect
          }
          type={showTokenSelect}
        />
      </Transition>
      <p className="mb-2 text-th-fgd-3">{t('short')}</p>
      <div className="mb-3 grid grid-cols-2">
        <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-3 bg-th-bkg-1">
          <TokenSelect
            token={inputToken}
            showTokenList={setShowTokenSelect}
            type="input"
          />
        </div>
        <div className="col-span-1">
          <Input
            type="text"
            name="amountIn"
            id="amountIn"
            className="w-full rounded-lg rounded-l-none border border-th-bkg-3 bg-th-bkg-1 p-3 text-right text-xl font-bold tracking-wider text-th-fgd-1 focus:outline-none"
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
          <ArrowDownIcon
            className="h-5 w-5"
            style={
              animateSwtichArrow % 2 == 0
                ? { transform: 'rotate(0deg)' }
                : { transform: 'rotate(360deg)' }
            }
          />
        </button>
      </div>
      <p className="mb-2 text-th-fgd-3">{t('long')}</p>
      <div className="mb-3 grid grid-cols-2">
        <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-3 bg-th-bkg-1">
          <TokenSelect
            token={outputToken}
            showTokenList={setShowTokenSelect}
            type="output"
          />
        </div>
        <div className="w-full rounded-lg rounded-l-none border border-th-bkg-3 bg-th-bkg-3 p-3 text-right text-xl font-bold tracking-wider text-th-fgd-3">
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
