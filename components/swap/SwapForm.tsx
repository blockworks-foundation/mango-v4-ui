import { useState, useCallback, useEffect, useMemo } from 'react'
import { PublicKey } from '@solana/web3.js'
import { ArrowDownIcon, CogIcon } from '@heroicons/react/solid'
import { RouteInfo } from '@jup-ag/core'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import Decimal from 'decimal.js'

import mangoStore, {
  INPUT_TOKEN_DEFAULT,
  OUTPUT_TOKEN_DEFAULT,
} from '../../store/state'
import ContentBox from '../shared/ContentBox'
import JupiterRouteInfo from './JupiterRouteInfo'
import TokenSelect from '../TokenSelect'
import useDebounce from '../shared/useDebounce'
import { floorToDecimal, numberFormat } from '../../utils/numbers'
import { SwapLeverageSlider } from './LeverageSlider'
import { useTranslation } from 'next-i18next'
import SelectToken from './SelectToken'
import { Transition } from '@headlessui/react'
import Button, { IconButton, LinkButton } from '../shared/Button'
import ButtonGroup from '../forms/ButtonGroup'
import Loading from '../shared/Loading'
import { EnterBottomExitBottom } from '../shared/Transitions'
import useJupiter from './useJupiter'
import SwapSettings from './SwapSettings'
import SheenLoader from '../shared/SheenLoader'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'

const MAX_DIGITS = 11
const withValueLimit = (values: NumberFormatValues): boolean => {
  return values.floatValue
    ? values.floatValue.toFixed(0).length <= MAX_DIGITS
    : true
}

const SwapForm = () => {
  const { t } = useTranslation('common')
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo>()
  const [amountInFormValue, setAmountInFormValue] = useState('')
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [showTokenSelect, setShowTokenSelect] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const set = mangoStore.getState().set
  const useMargin = mangoStore((s) => s.swap.margin)
  const slippage = mangoStore((s) => s.swap.slippage)
  const inputTokenInfo = mangoStore((s) => s.swap.inputTokenInfo)
  const outputTokenInfo = mangoStore((s) => s.swap.outputTokenInfo)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)
  const connected = mangoStore((s) => s.connected)
  const [debouncedAmountIn] = useDebounce(amountInFormValue, 300)

  const { amountOut, jupiter, routes } = useJupiter({
    inputTokenInfo,
    outputTokenInfo,
    inputAmount: debouncedAmountIn,
    slippage,
  })

  useEffect(() => {
    setSelectedRoute(routes[0])
  }, [routes])

  const handleAmountInChange = useCallback((e: NumberFormatValues) => {
    setAmountInFormValue(e.value)
  }, [])

  const handleTokenInSelect = useCallback(
    (mintAddress: string) => {
      const inputTokenInfo = jupiterTokens.find(
        (t: any) => t.address === mintAddress
      )
      const group = mangoStore.getState().group
      if (group) {
        const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
        set((s) => {
          s.swap.inputBank = bank
          s.swap.inputTokenInfo = inputTokenInfo
        })
      }
      setShowTokenSelect('')
    },
    [jupiterTokens, set]
  )

  const handleTokenOutSelect = useCallback(
    (mintAddress: string) => {
      const outputTokenInfo = jupiterTokens.find(
        (t: any) => t.address === mintAddress
      )
      const group = mangoStore.getState().group
      if (group) {
        const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
        set((s) => {
          s.swap.outputBank = bank
          s.swap.outputTokenInfo = outputTokenInfo
        })
      }
      setShowTokenSelect('')
    },
    [jupiterTokens, set]
  )

  const handleSwitchTokens = useCallback(() => {
    setAmountInFormValue(amountOut.toString())
    const inputBank = mangoStore.getState().swap.inputBank
    const outputBank = mangoStore.getState().swap.outputBank
    set((s) => {
      s.swap.inputBank = outputBank
      s.swap.outputBank = inputBank
      s.swap.inputTokenInfo = outputTokenInfo
      s.swap.outputTokenInfo = inputTokenInfo
    })
    setAnimateSwitchArrow(
      (prevanimateSwitchArrow) => prevanimateSwitchArrow + 1
    )
  }, [inputTokenInfo, outputTokenInfo, set, amountOut])

  const amountIn: Decimal | null = useMemo(() => {
    return Number(debouncedAmountIn)
      ? new Decimal(debouncedAmountIn)
      : new Decimal(0)
  }, [debouncedAmountIn])

  const isLoadingTradeDetails = useMemo(() => {
    return (
      amountIn.toNumber() && connected && (!selectedRoute || !outputTokenInfo)
    )
  }, [amountIn, connected, selectedRoute, outputTokenInfo])

  return (
    <ContentBox showBackground className="relative overflow-hidden">
      <Transition
        className="thin-scroll absolute top-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-2 p-6 pb-0"
        show={showConfirm}
        enter="transition ease-in duration-300"
        enterFrom="translate-x-full"
        enterTo="translate-x-0"
        leave="transition ease-out duration-300"
        leaveFrom="translate-x-0"
        leaveTo="translate-x-full"
      >
        <JupiterRouteInfo
          inputTokenInfo={inputTokenInfo}
          onClose={() => setShowConfirm(false)}
          amountIn={amountIn}
          slippage={slippage}
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
        <IconButton
          className="text-th-fgd-3"
          onClick={() => setShowSettings(true)}
          size="small"
        >
          <CogIcon className="h-5 w-5" />
        </IconButton>
      </div>
      <EnterBottomExitBottom
        className="thin-scroll absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-2 p-6 pb-0"
        show={showSettings}
      >
        <SwapSettings onClose={() => setShowSettings(false)} />
      </EnterBottomExitBottom>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-th-fgd-3">{t('sell')}</p>
        <MaxSwapAmount
          useMargin={useMargin}
          setAmountIn={setAmountInFormValue}
        />
      </div>
      <div className="mb-3 grid grid-cols-2">
        <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-4 bg-th-bkg-1">
          <TokenSelect
            tokenSymbol={inputTokenInfo?.symbol || INPUT_TOKEN_DEFAULT}
            showTokenList={setShowTokenSelect}
            type="input"
          />
        </div>
        <div className="col-span-1">
          <NumberFormat
            inputMode="decimal"
            thousandSeparator=","
            decimalScale={inputTokenInfo?.decimals || 6}
            name="amountIn"
            id="amountIn"
            className="w-full rounded-lg rounded-l-none border border-th-bkg-4 bg-th-bkg-1 p-3 text-right text-xl font-bold tracking-wider text-th-fgd-1 focus:outline-none"
            placeholder="0.00"
            value={amountInFormValue}
            onValueChange={handleAmountInChange}
            isAllowed={withValueLimit}
          />
        </div>
        {!useMargin ? (
          <PercentageSelectButtons setAmountIn={setAmountInFormValue} />
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
            tokenSymbol={outputTokenInfo?.symbol || OUTPUT_TOKEN_DEFAULT}
            showTokenList={setShowTokenSelect}
            type="output"
          />
        </div>
        <div className="flex w-full items-center justify-end rounded-r-lg border border-th-bkg-4 bg-th-bkg-3 text-right text-xl font-bold tracking-wider text-th-fgd-3">
          {isLoadingTradeDetails ? (
            <div className="w-full">
              <SheenLoader className="rounded-l-none">
                <div className="h-[52px] w-full rounded-r-lg bg-th-bkg-3" />
              </SheenLoader>
            </div>
          ) : (
            <span className="p-3">
              {amountOut ? numberFormat.format(amountOut) : ''}
            </span>
          )}
        </div>
      </div>
      {useMargin ? (
        <>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-th-fgd-3">{t('leverage')}</p>
            <p className="text-th-fgd-1">0.00x</p>
          </div>
          <SwapLeverageSlider
            amount={amountIn.toNumber()}
            onChange={setAmountInFormValue}
          />
        </>
      ) : null}
      <Button
        onClick={() => setShowConfirm(true)}
        className="mt-6 flex w-full items-center justify-center text-base"
        disabled={
          !amountIn.toNumber() ||
          !connected ||
          !routes?.length ||
          !selectedRoute ||
          !outputTokenInfo
        }
        size="large"
      >
        {connected ? (
          isLoadingTradeDetails ? (
            <Loading />
          ) : (
            <div className="flex items-center">{t('trade:review-trade')}</div>
          )
        ) : (
          t('connect')
        )}
      </Button>
    </ContentBox>
  )
}

export default SwapForm

export const useTokenMax = () => {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)
  const slippage = mangoStore((s) => s.swap.slippage)

  const tokenInMax = useMemo(() => {
    const group = mangoStore.getState().group

    if (!group || !inputBank || !mangoAccount || !outputBank)
      return { amount: 0.0, decimals: 6, amountWithBorrow: 0.0 }

    const amount = mangoAccount.getTokenBalanceUi(inputBank)
    const amountWithBorrow = mangoAccount
      ?.getMaxSourceForTokenSwap(
        group,
        inputBank.mint,
        outputBank.mint,
        0.98 - slippage / 10
      )
      .toNumber()

    return {
      amount: amount > 0 ? floorToDecimal(amount, inputBank.mintDecimals) : 0,
      amountWithBorrow:
        amountWithBorrow > 0
          ? floorToDecimal(
              toUiDecimals(amountWithBorrow, inputBank.mintDecimals),
              inputBank.mintDecimals
            )
          : 0,
      decimals: inputBank.mintDecimals,
    }
  }, [inputBank, mangoAccount, outputBank, slippage])

  return tokenInMax
}

const MaxSwapAmount = ({
  setAmountIn,
  useMargin,
}: {
  setAmountIn: (x: any) => void
  useMargin: boolean
}) => {
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const { t } = useTranslation('common')
  const { amount: tokenMax, amountWithBorrow } = useTokenMax()

  const setMaxInputAmount = () => {
    const amountIn = useMargin ? amountWithBorrow : tokenMax
    setAmountIn(amountIn)
  }

  if (mangoAccountLoading) return null

  return (
    <LinkButton className="no-underline" onClick={setMaxInputAmount}>
      <span className="font-normal text-th-fgd-4">{t('max')}:</span>
      <span className="mx-1 text-th-fgd-3 underline">
        {useMargin ? amountWithBorrow : tokenMax}
      </span>
    </LinkButton>
  )
}

const PercentageSelectButtons = ({
  setAmountIn,
}: {
  setAmountIn: (x: any) => any
}) => {
  const [sizePercentage, setSizePercentage] = useState('')
  const { amount: tokenMax, decimals } = useTokenMax()

  const handleSizePercentage = (percentage: string) => {
    setSizePercentage(percentage)
    if (tokenMax > 0) {
      let amount = (Number(percentage) / 100) * tokenMax
      if (percentage !== '100') {
        amount = floorToDecimal(amount, decimals)
      }
      setAmountIn(amount.toString())
    } else {
      setAmountIn('0')
    }
  }

  return (
    <div className="col-span-2 mt-2">
      <ButtonGroup
        activeValue={sizePercentage}
        onChange={(p) => handleSizePercentage(p)}
        values={['10', '25', '50', '75', '100']}
        unit="%"
      />
    </div>
  )
}
