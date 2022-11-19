import { useState, useCallback, useEffect, useMemo } from 'react'
import { PublicKey } from '@solana/web3.js'
import {
  ArrowDownIcon,
  Cog8ToothIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  LinkIcon,
} from '@heroicons/react/20/solid'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import Decimal from 'decimal.js'
import mangoStore from '@store/mangoStore'
import ContentBox from '../shared/ContentBox'
import JupiterRouteInfo from './JupiterRouteInfo'
import TokenSelect from './TokenSelect'
import useDebounce from '../shared/useDebounce'
import { floorToDecimal, numberFormat } from '../../utils/numbers'
import { SwapLeverageSlider } from './LeverageSlider'
import { useTranslation } from 'next-i18next'
import SwapFormTokenList from './SwapFormTokenList'
import { Transition } from '@headlessui/react'
import Button, { IconButton } from '../shared/Button'
import ButtonGroup from '../forms/ButtonGroup'
import Loading from '../shared/Loading'
import { EnterBottomExitBottom } from '../shared/Transitions'
import useJupiterRoutes from './useJupiterRoutes'
import SwapSettings from './SwapSettings'
import SheenLoader from '../shared/SheenLoader'
import { HealthType } from '@blockworks-foundation/mango-v4'
import {
  INPUT_TOKEN_DEFAULT,
  MANGO_MINT,
  OUTPUT_TOKEN_DEFAULT,
  USDC_MINT,
} from '../../utils/constants'
import { useTokenMax } from './useTokenMax'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import HealthImpact from '@components/shared/HealthImpact'
import { useWallet } from '@solana/wallet-adapter-react'
import useMangoAccount from 'hooks/useMangoAccount'
import { RouteInfo } from 'types/jupiter'

const MAX_DIGITS = 11
export const withValueLimit = (values: NumberFormatValues): boolean => {
  return values.floatValue
    ? values.floatValue.toFixed(0).length <= MAX_DIGITS
    : true
}

const SwapForm = () => {
  const { t } = useTranslation(['common', 'swap'])
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo>()
  const [amountInFormValue, setAmountInFormValue] = useState('')
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [showTokenSelect, setShowTokenSelect] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const set = mangoStore.getState().set
  const {
    margin: useMargin,
    slippage,
    inputBank,
    outputBank,
  } = mangoStore((s) => s.swap)
  const [debouncedAmountIn] = useDebounce(amountInFormValue, 300)
  const { mangoAccount } = useMangoAccount()
  const { connected } = useWallet()

  const amountIn: Decimal | null = useMemo(() => {
    return Number(debouncedAmountIn)
      ? new Decimal(debouncedAmountIn)
      : new Decimal(0)
  }, [debouncedAmountIn])

  const { bestRoute, routes } = useJupiterRoutes({
    inputMint: inputBank?.mint.toString() || USDC_MINT,
    outputMint: outputBank?.mint.toString() || MANGO_MINT,
    inputAmount: debouncedAmountIn,
    slippage,
  })

  const outAmount: number = useMemo(() => {
    return selectedRoute?.outAmount.toString()
      ? new Decimal(selectedRoute.outAmount.toString())
          .div(10 ** outputBank!.mintDecimals)
          .toNumber()
      : 0
  }, [selectedRoute, outputBank])

  useEffect(() => {
    if (bestRoute) {
      setSelectedRoute(bestRoute)
    }
  }, [bestRoute])

  useEffect(() => {
    setAmountInFormValue('')
  }, [useMargin])

  const handleAmountInChange = useCallback((e: NumberFormatValues) => {
    setAmountInFormValue(e.value)
  }, [])

  const handleTokenInSelect = useCallback(
    (mintAddress: string) => {
      const group = mangoStore.getState().group
      if (group) {
        const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
        set((s) => {
          s.swap.inputBank = bank
        })
      }
      setShowTokenSelect('')
    },
    [set]
  )

  const handleTokenOutSelect = useCallback(
    (mintAddress: string) => {
      const group = mangoStore.getState().group
      if (group) {
        const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
        set((s) => {
          s.swap.outputBank = bank
        })
      }
      setShowTokenSelect('')
    },
    [set]
  )

  const handleSwitchTokens = useCallback(() => {
    if (amountIn?.gt(0) && outAmount) {
      setAmountInFormValue(outAmount.toString())
    }
    const inputBank = mangoStore.getState().swap.inputBank
    const outputBank = mangoStore.getState().swap.outputBank
    set((s) => {
      s.swap.inputBank = outputBank
      s.swap.outputBank = inputBank
    })
    setAnimateSwitchArrow(
      (prevanimateSwitchArrow) => prevanimateSwitchArrow + 1
    )
  }, [set, outAmount, amountIn])

  const maintProjectedHealth = useMemo(() => {
    const group = mangoStore.getState().group
    if (!inputBank || !mangoAccount || !outputBank || !outAmount || !group)
      return 0

    const simulatedHealthRatio =
      mangoAccount.simHealthRatioWithTokenPositionUiChanges(
        group,
        [
          {
            mintPk: inputBank.mint,
            uiTokenAmount: amountIn.toNumber() * -1,
          },
          {
            mintPk: outputBank.mint,
            uiTokenAmount: outAmount,
          },
        ],
        HealthType.maint
      )
    return simulatedHealthRatio! > 100
      ? 100
      : simulatedHealthRatio! < 0
      ? 0
      : Math.trunc(simulatedHealthRatio!)
  }, [mangoAccount, inputBank, outputBank, amountIn, outAmount])

  const loadingSwapDetails: boolean = useMemo(() => {
    return !!amountIn.toNumber() && connected && !selectedRoute
  }, [amountIn, connected, selectedRoute])

  return (
    <ContentBox
      hidePadding
      // showBackground
      className="relative overflow-hidden border-x-0 md:border-l md:border-r-0 md:border-t-0 md:border-b-0"
    >
      <div className="p-6 pt-3">
        <Transition
          className="thin-scroll absolute top-0 left-0 z-10 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
          show={showConfirm}
          enter="transition ease-in duration-300"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-out duration-300"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <JupiterRouteInfo
            onClose={() => setShowConfirm(false)}
            amountIn={amountIn}
            slippage={slippage}
            routes={routes}
            selectedRoute={selectedRoute}
            setSelectedRoute={setSelectedRoute}
          />
        </Transition>
        <EnterBottomExitBottom
          className="thin-scroll absolute bottom-0 left-0 z-10 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
          show={!!showTokenSelect}
        >
          <SwapFormTokenList
            onClose={() => setShowTokenSelect('')}
            onTokenSelect={
              showTokenSelect === 'input'
                ? handleTokenInSelect
                : handleTokenOutSelect
            }
            type={showTokenSelect}
            useMargin={useMargin}
          />
        </EnterBottomExitBottom>
        <EnterBottomExitBottom
          className="thin-scroll absolute bottom-0 left-0 z-10 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
          show={showSettings}
        >
          <SwapSettings onClose={() => setShowSettings(false)} />
        </EnterBottomExitBottom>
        <div className="flex items-center justify-end">
          <div id="swap-step-one">
            <IconButton
              className="-mr-2 text-th-fgd-3"
              hideBg
              onClick={() => setShowSettings(true)}
              size="small"
            >
              <Cog8ToothIcon className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
        <div className="mb-2 flex items-end justify-between">
          <p className="text-th-fgd-3">{t('swap:pay')}</p>
          <MaxSwapAmount
            useMargin={useMargin}
            setAmountIn={setAmountInFormValue}
          />
        </div>
        <div className="mb-3 grid grid-cols-2" id="swap-step-two">
          <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-4 bg-th-bkg-1">
            <TokenSelect
              tokenSymbol={inputBank?.name || INPUT_TOKEN_DEFAULT}
              showTokenList={setShowTokenSelect}
              type="input"
            />
          </div>
          <div className="col-span-1 flex h-[54px]">
            <NumberFormat
              inputMode="decimal"
              thousandSeparator=","
              allowNegative={false}
              isNumericString={true}
              decimalScale={inputBank?.mintDecimals || 6}
              name="amountIn"
              id="amountIn"
              className="w-full rounded-r-lg border border-th-bkg-4 bg-th-bkg-1 p-3 text-right font-mono text-base font-bold text-th-fgd-1 focus:outline-none lg:text-lg xl:text-xl"
              placeholder="0.00"
              value={amountInFormValue}
              onValueChange={handleAmountInChange}
              isAllowed={withValueLimit}
            />
          </div>
          {!useMargin ? (
            <PercentageSelectButtons
              amountIn={amountInFormValue}
              setAmountIn={setAmountInFormValue}
              useMargin={useMargin}
            />
          ) : null}
        </div>
        <div className="-mb-2 flex justify-center">
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
        <p className="mb-2 text-th-fgd-3">{t('swap:receive')}</p>
        <div id="swap-step-three" className="mb-3 grid grid-cols-2">
          <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-4 bg-th-bkg-1">
            <TokenSelect
              tokenSymbol={outputBank?.name || OUTPUT_TOKEN_DEFAULT}
              showTokenList={setShowTokenSelect}
              type="output"
            />
          </div>
          <div className="flex h-[54px] w-full items-center justify-end rounded-r-lg border border-th-bkg-4 bg-th-bkg-3 text-right text-lg font-bold text-th-fgd-3 xl:text-xl">
            {loadingSwapDetails ? (
              <div className="w-full">
                <SheenLoader className="flex flex-1 rounded-l-none">
                  <div className="h-[52px] w-full rounded-r-lg bg-th-bkg-4" />
                </SheenLoader>
              </div>
            ) : (
              // <span className="p-3 font-mono">
              //   {amountOut ? numberFormat.format(amountOut.toNumber()) : ''}
              // </span>
              <NumberFormat
                inputMode="decimal"
                thousandSeparator=","
                allowNegative={false}
                isNumericString={true}
                decimalScale={outputBank?.mintDecimals || 6}
                name="amountOut"
                id="amountOut"
                className="w-full rounded-r-lg bg-th-bkg-3 p-3 text-right font-mono text-base font-bold text-th-fgd-3 focus:outline-none lg:text-lg xl:text-xl"
                placeholder="0.00"
                disabled
                value={outAmount ? numberFormat.format(outAmount) : ''}
              />
            )}
          </div>
        </div>
        {useMargin ? (
          <>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-th-fgd-3">{t('leverage')}</p>
              {/* <p className="text-th-fgd-1">0.00x</p> */}
            </div>
            <SwapLeverageSlider
              useMargin={useMargin}
              amount={amountIn.toNumber()}
              onChange={setAmountInFormValue}
              step={1 / 10 ** (inputBank?.mintDecimals || 6)}
            />
          </>
        ) : null}
        <SwapFormSubmitButton
          loadingSwapDetails={loadingSwapDetails}
          useMargin={useMargin}
          setShowConfirm={setShowConfirm}
          amountIn={amountIn}
          inputSymbol={inputBank?.name}
          amountOut={selectedRoute ? outAmount : undefined}
        />
      </div>
      <div
        id="swap-step-four"
        className={`border-t border-th-bkg-3 px-6 py-4 transition-all`}
      >
        <HealthImpact maintProjectedHealth={maintProjectedHealth} />
      </div>
    </ContentBox>
  )
}

export default SwapForm

const SwapFormSubmitButton = ({
  amountIn,
  amountOut,
  inputSymbol,
  loadingSwapDetails,
  setShowConfirm,
  useMargin,
}: {
  amountIn: Decimal
  amountOut: number | undefined
  inputSymbol: string | undefined
  loadingSwapDetails: boolean
  setShowConfirm: (x: any) => any
  useMargin: boolean
}) => {
  const { t } = useTranslation('common')
  const { connected } = useWallet()
  const { amount: tokenMax, amountWithBorrow } = useTokenMax(useMargin)

  const showInsufficientBalance = useMargin
    ? amountWithBorrow.lt(amountIn)
    : tokenMax.lt(amountIn)

  const disabled =
    !amountIn.toNumber() || !connected || showInsufficientBalance || !amountOut

  return (
    <Button
      onClick={() => setShowConfirm(true)}
      className="mt-6 flex w-full items-center justify-center text-base"
      disabled={disabled}
      size="large"
    >
      {connected ? (
        showInsufficientBalance ? (
          <div className="flex items-center">
            <ExclamationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0" />
            {t('swap:insufficient-balance', {
              symbol: inputSymbol,
            })}
          </div>
        ) : loadingSwapDetails ? (
          <Loading />
        ) : disabled ? (
          <div className="flex items-center">
            <ExclamationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0" />
            No routes found
          </div>
        ) : (
          <div className="flex items-center">
            <MagnifyingGlassIcon className="mr-2 h-5 w-5" />
            {t('swap:review-swap')}
          </div>
        )
      ) : (
        <div className="flex items-center">
          <LinkIcon className="mr-2 h-5 w-5" />
          {t('connect')}
        </div>
      )}
    </Button>
  )
}

const MaxSwapAmount = ({
  setAmountIn,
  useMargin,
}: {
  setAmountIn: (x: string) => void
  useMargin: boolean
}) => {
  const { t } = useTranslation('common')
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const {
    amount: tokenMax,
    amountWithBorrow,
    decimals,
  } = useTokenMax(useMargin)

  if (mangoAccountLoading) return null

  return (
    <div className="flex flex-wrap justify-end pl-6 text-xs">
      <MaxAmountButton
        className="mb-0.5"
        label="Bal"
        onClick={() => setAmountIn(tokenMax.toFixed(decimals))}
        value={tokenMax.toFixed()}
      />
      {useMargin ? (
        <MaxAmountButton
          className="mb-0.5 ml-2"
          label={t('max')}
          onClick={() => setAmountIn(amountWithBorrow.toFixed(decimals))}
          value={amountWithBorrow.toFixed()}
        />
      ) : null}
    </div>
  )
}

const PercentageSelectButtons = ({
  amountIn,
  setAmountIn,
  useMargin,
}: {
  amountIn: string
  setAmountIn: (x: string) => any
  useMargin: boolean
}) => {
  const [sizePercentage, setSizePercentage] = useState('')
  const { amount: tokenMax, decimals } = useTokenMax(useMargin)

  useEffect(() => {
    if (tokenMax.gt(0) && amountIn && tokenMax.eq(amountIn)) {
      setSizePercentage('100')
    }
  }, [amountIn, tokenMax])

  const handleSizePercentage = (percentage: string) => {
    setSizePercentage(percentage)
    if (tokenMax.gt(0)) {
      let amount = tokenMax.mul(percentage).div(100)
      if (percentage !== '100') {
        amount = floorToDecimal(amount, decimals)
      }
      setAmountIn(amount.toFixed())
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
