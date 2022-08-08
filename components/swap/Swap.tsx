import { useState, ChangeEvent, useCallback, useEffect, useMemo } from 'react'
import { TransactionInstruction } from '@solana/web3.js'
import { ArrowDownIcon, CogIcon } from '@heroicons/react/solid'
import mangoStore from '../../store/state'
import { RouteInfo } from '@jup-ag/core'
import { Token } from '../../types/jupiter'
import ContentBox from '../shared/ContentBox'
import { notify } from '../../utils/notifications'
import JupiterRoutes from './JupiterRoutes'
import TokenSelect from '../TokenSelect'
import useDebounce from '../shared/useDebounce'
import {
  floorToDecimal,
  formatFixedDecimals,
  numberFormat,
} from '../../utils/numbers'
import LeverageSlider from './LeverageSlider'
import Input from '../forms/Input'
import { useTranslation } from 'next-i18next'
import SelectToken from './SelectToken'
import { Transition } from '@headlessui/react'
import Switch from '../forms/Switch'
import Button, { LinkButton } from '../shared/Button'
import ButtonGroup from '../forms/ButtonGroup'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import Loading from '../shared/Loading'
import { EnterBottomExitBottom } from '../shared/Transitions'
import useJupiter from './useJupiter'
import SwapSettings from './SwapSettings'

const getBestRoute = (routesInfos: RouteInfo[]) => {
  return routesInfos[0]
}

const MaxWalletBalance = ({
  inputToken,
  setAmountIn,
}: {
  inputToken: string
  setAmountIn: (x: any) => void
}) => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  const tokenInMax = useMemo(() => {
    const group = mangoStore.getState().group
    const bank = group?.banksMap.get(inputToken)

    if (!group || !bank || !mangoAccount) return 0.0
    const balance = mangoAccount.getUi(bank)

    return floorToDecimal(balance, bank.mintDecimals)
  }, [inputToken, mangoAccount])

  const setMaxInputAmount = () => {
    setAmountIn(tokenInMax)
  }

  return (
    <LinkButton className="no-underline" onClick={setMaxInputAmount}>
      <span className="mr-1 font-normal text-th-fgd-4">{t('balance')}:</span>
      <span className="text-th-fgd-3 underline">
        {formatFixedDecimals(tokenInMax)}
      </span>
    </LinkButton>
  )
}

const Swap = () => {
  const { t } = useTranslation('common')
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo>()
  const [amountIn, setAmountIn] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [showTokenSelect, setShowTokenSelect] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [useMargin, setUseMargin] = useState(true)
  const [sizePercentage, setSizePercentage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [slippage, setSlippage] = useState(0.1)

  const set = mangoStore.getState().set
  const inputToken = mangoStore((s) => s.swap.inputToken)
  const outputToken = mangoStore((s) => s.swap.outputToken)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)
  const connected = mangoStore((s) => s.connected)
  const debouncedAmountIn = useDebounce(amountIn, 300)

  const { amountOut, jupiter, outputTokenInfo, routes } = useJupiter({
    inputTokenSymbol: inputToken,
    outputTokenSymbol: outputToken,
    inputAmount: Number(debouncedAmountIn),
    slippage,
  })

  useEffect(() => {
    console.log('setting selected route')
    setSelectedRoute(routes[0])
  }, [routes])

  const handleAmountInChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setAmountIn(e.target.value)
    },
    []
  )

  const handleTokenInSelect = (symbol: string) => {
    const inputTokenInfo = jupiterTokens.find((t: any) => t.symbol === symbol)
    set((s) => {
      s.swap.inputToken = symbol
      s.swap.inputTokenInfo = inputTokenInfo
    })
    setShowTokenSelect('')
  }

  const handleTokenOutSelect = (symbol: string) => {
    const outputTokenInfo = jupiterTokens.find((t: any) => t.symbol === symbol)
    set((s) => {
      s.swap.outputToken = symbol
      s.swap.outputTokenInfo = outputTokenInfo
    })
    setShowTokenSelect('')
  }

  const handleSwitchTokens = () => {
    const inputTokenInfo = jupiterTokens.find(
      (t: any) => t.symbol === inputToken
    )
    const outputTokenInfo = jupiterTokens.find(
      (t: any) => t.symbol === outputToken
    )
    set((s) => {
      s.swap.inputToken = outputToken
      s.swap.outputToken = inputToken
      s.swap.inputTokenInfo = outputTokenInfo
      s.swap.outputTokenInfo = inputTokenInfo
    })

    setAnimateSwitchArrow(animateSwitchArrow + 1)
  }

  const handleSizePercentage = (percentage: string) => {
    setSizePercentage(percentage)

    // TODO: calc max
    const max = 100
    const amount = (Number(percentage) / 100) * max
    setAmountIn(amount.toFixed())
  }

  const handleSwap = async (
    userDefinedInstructions: TransactionInstruction[]
  ) => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!mangoAccount || !group) return

    try {
      setSubmitting(true)
      const tx = await client.marginTrade({
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

  const isLoadingTradeDetails =
    amountIn &&
    connected &&
    (!routes?.length || !selectedRoute || !outputTokenInfo)

  return (
    <ContentBox showBackground className="relative overflow-hidden">
      <Transition
        className="thin-scroll absolute top-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-2 p-6 pb-0"
        show={showConfirm}
        enter="transition-all ease-in duration-300"
        enterFrom="transform translate-x-full"
        enterTo="transform translate-x-0"
        leave="transition-all ease-out duration-300"
        leaveFrom="transform translate-x-0"
        leaveTo="transform translate-x-full"
      >
        <JupiterRoutes
          inputToken={inputToken}
          onClose={() => setShowConfirm(false)}
          outputToken={outputToken}
          amountIn={parseFloat(debouncedAmountIn)}
          slippage={slippage}
          handleSwap={handleSwap}
          submitting={submitting}
          outputTokenInfo={outputTokenInfo}
          jupiter={jupiter}
          routes={routes}
          selectedRoute={selectedRoute}
          setSelectedRoute={setSelectedRoute}
        />
      </Transition>
      <EnterBottomExitBottom
        className="thin-scroll absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-2 p-6 pb-0"
        show={!!showTokenSelect}
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
      </EnterBottomExitBottom>
      <div className="mb-4 flex items-center justify-between">
        <h3>{t('trade')}</h3>
        <div
          className="hover:cursor-pointer"
          onClick={() => setShowSettings(true)}
        >
          <CogIcon className="h-6 w-6" />
        </div>
      </div>
      <EnterBottomExitBottom
        className="thin-scroll absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-2 p-6 pb-0"
        show={showSettings}
      >
        <SwapSettings onClose={() => setShowSettings(false)} />
      </EnterBottomExitBottom>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-th-fgd-3">{t('sell')}</p>
        <MaxWalletBalance inputToken={inputToken} setAmountIn={setAmountIn} />
      </div>
      <div className="mb-3 grid grid-cols-2">
        <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-4 bg-th-bkg-1">
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
            className="w-full rounded-lg rounded-l-none border border-th-bkg-4 bg-th-bkg-1 p-3 text-right text-xl font-bold tracking-wider text-th-fgd-1 focus:outline-none"
            placeholder="0.00"
            value={amountIn}
            onChange={handleAmountInChange}
          />
        </div>
        {!useMargin ? (
          <div className="col-span-2 mt-2">
            <ButtonGroup
              activeValue={sizePercentage}
              onChange={(p) => handleSizePercentage(p)}
              values={['10', '25', '50', '75', '100']}
              unit="%"
            />
          </div>
        ) : null}
      </div>
      <div className="flex justify-center">
        <button
          className="rounded-full border border-th-bkg-4 p-1.5 text-th-fgd-3 md:hover:text-th-primary"
          onClick={handleSwitchTokens}
        >
          <ArrowDownIcon
            className="h-5 w-5"
            style={
              animateSwitchArrow % 2 == 0
                ? { transform: 'rotate(0deg)' }
                : { transform: 'rotate(360deg)' }
            }
          />
        </button>
      </div>
      <p className="mb-2 text-th-fgd-3">{t('buy')}</p>
      <div className="mb-3 grid grid-cols-2">
        <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-4 bg-th-bkg-1">
          <TokenSelect
            token={outputToken}
            showTokenList={setShowTokenSelect}
            type="output"
          />
        </div>
        <div className="w-full rounded-lg rounded-l-none border border-th-bkg-4 bg-th-bkg-3 p-3 text-right text-xl font-bold tracking-wider text-th-fgd-3">
          {amountOut ? numberFormat.format(amountOut) : 0}
        </div>
      </div>
      {useMargin ? (
        <>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-th-fgd-3">{t('leverage')}</p>
            <p className="text-th-fgd-3">0.00x</p>
          </div>
          <LeverageSlider
            inputToken={inputToken}
            outputToken={outputToken}
            onChange={(x) => setAmountIn(x)}
          />
        </>
      ) : null}
      <Button
        onClick={() => setShowConfirm(true)}
        className="mt-6 flex w-full items-center justify-center text-base"
        disabled={
          !connected || !routes?.length || !selectedRoute || !outputTokenInfo
        }
        size="large"
      >
        {connected ? (
          isLoadingTradeDetails ? (
            <Loading />
          ) : (
            t('trade:review-trade')
          )
        ) : (
          t('connect')
        )}
      </Button>
    </ContentBox>
  )
}

export default Swap
