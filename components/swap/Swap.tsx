import { useState, ChangeEvent, useCallback, Fragment, useEffect } from 'react'
import { TransactionInstruction } from '@solana/web3.js'
import { ArrowDownIcon, XIcon } from '@heroicons/react/solid'
import mangoStore, { CLUSTER } from '../../store/state'
import { Jupiter, RouteInfo } from '@jup-ag/core'
import { TokenInfo } from '../../types/jupiter'
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
import Switch from '../forms/Switch'
import Button, { IconButton, LinkButton } from '../shared/Button'
import ButtonGroup from '../forms/ButtonGroup'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import Loading from '../shared/Loading'
import { EnterBottomExitBottom } from '../shared/Transitions'

const getBestRoute = (routesInfos: RouteInfo[]) => {
  return routesInfos[0]
}

const Swap = () => {
  const { t } = useTranslation('common')
  const [jupiter, setJupiter] = useState<Jupiter>()
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo>()
  const [outputTokenInfo, setOutputTokenInfo] = useState<TokenInfo>()
  const [routes, setRoutes] = useState<RouteInfo[]>()
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState<number>()
  const [inputToken, setInputToken] = useState('SOL')
  const [outputToken, setOutputToken] = useState('USDC')
  const [submitting, setSubmitting] = useState(false)
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [showTokenSelect, setShowTokenSelect] = useState('')
  const [useMargin, setUseMargin] = useState(true)
  const [sizePercentage, setSizePercentage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [slippage, setSlippage] = useState(0.1)

  const set = mangoStore.getState().set
  const tokens = mangoStore((s) => s.jupiterTokens)
  const connected = mangoStore((s) => s.connected)
  const debouncedAmountIn = useDebounce(amountIn, 400)

  useEffect(() => {
    const connection = mangoStore.getState().connection
    const loadJupiter = async () => {
      const jupiter = await Jupiter.load({
        connection,
        cluster: CLUSTER,
        // platformFeeAndAccounts:  NO_PLATFORM_FEE,
        routeCacheDuration: 10_000, // Will not refetch data on computeRoutes for up to 10 seconds
      })
      setJupiter(jupiter)
    }
    loadJupiter()
  }, [])

  useEffect(() => {
    const group = mangoStore.getState().group
    if (!group) return
    const tokens = mangoStore.getState().jupiterTokens

    const loadRoutes = async () => {
      const inputBank = group!.banksMap.get(inputToken)
      const outputBank = group!.banksMap.get(outputToken)
      if (!inputBank || !outputBank) return
      if (!debouncedAmountIn) {
        setAmountOut(undefined)
        setSelectedRoute(undefined)
      } else {
        const computedRoutes = await jupiter?.computeRoutes({
          inputMint: inputBank.mint, // Mint address of the input token
          outputMint: outputBank.mint, // Mint address of the output token
          inputAmount: Number(debouncedAmountIn) * 10 ** inputBank.mintDecimals, // raw input amount of tokens
          slippage, // The slippage in % terms
          filterTopNResult: 10,
          onlyDirectRoutes: true,
        })
        const tokenOut = tokens.find(
          (t: any) => t.address === outputBank.mint.toString()
        )
        setOutputTokenInfo(tokenOut)
        const routesInfosWithoutRaydium = computedRoutes?.routesInfos.filter(
          (r) => {
            if (r.marketInfos.length > 1) {
              for (const mkt of r.marketInfos) {
                if (mkt.amm.label === 'Raydium') return false
              }
            }
            return true
          }
        )
        if (routesInfosWithoutRaydium?.length) {
          setRoutes(routesInfosWithoutRaydium)
          const bestRoute = getBestRoute(computedRoutes!.routesInfos)
          setSelectedRoute(bestRoute)
          setAmountOut(toUiDecimals(bestRoute.outAmount, tokenOut?.decimals))
        }
      }
    }

    loadRoutes()
  }, [inputToken, outputToken, jupiter, slippage, debouncedAmountIn])

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
          setAmountOut={setAmountOut}
          outputTokenInfo={outputTokenInfo}
          jupiter={jupiter}
          routes={routes}
          selectedRoute={selectedRoute}
          setSelectedRoute={setSelectedRoute}
        />
      </Transition>
      <EnterBottomExitBottom
        className="thin-scroll absolute bottom-0 left-0 z-20 h-full overflow-auto bg-th-bkg-2 p-6 pb-0"
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
        <Switch
          className="text-th-fgd-3"
          checked={useMargin}
          onChange={() => setUseMargin(!useMargin)}
        >
          {t('margin')}
        </Switch>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-th-fgd-3">{t('sell')}</p>
        <LinkButton
          className="no-underline"
          onClick={() => console.log('Set max input amount')}
        >
          <span className="mr-1 font-normal text-th-fgd-4">
            {t('balance')}:
          </span>
          <span className="text-th-fgd-3 underline">0</span>
        </LinkButton>
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
              values={['0', '25', '50', '75', '100']}
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
