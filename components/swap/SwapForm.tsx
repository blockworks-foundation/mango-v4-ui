import { useState, useCallback, useEffect, useMemo } from 'react'
import { PublicKey } from '@solana/web3.js'
import {
  ArrowDownIcon,
  Cog8ToothIcon,
  ExclamationCircleIcon,
  LinkIcon,
  PencilIcon,
} from '@heroicons/react/20/solid'
import NumberFormat, {
  NumberFormatValues,
  SourceInfo,
} from 'react-number-format'
import Decimal from 'decimal.js'
import mangoStore from '@store/mangoStore'
import ContentBox from '../shared/ContentBox'
import SwapReviewRouteInfo from './SwapReviewRouteInfo'
import TokenSelect from './TokenSelect'
import useDebounce from '../shared/useDebounce'
import { useTranslation } from 'next-i18next'
import SwapFormTokenList from './SwapFormTokenList'
import { Transition } from '@headlessui/react'
import Button, { IconButton } from '../shared/Button'
import Loading from '../shared/Loading'
import { EnterBottomExitBottom } from '../shared/Transitions'
import useJupiterRoutes from './useJupiterRoutes'
import SheenLoader from '../shared/SheenLoader'
import { HealthType } from '@blockworks-foundation/mango-v4'
import {
  INPUT_TOKEN_DEFAULT,
  MANGO_MINT,
  OUTPUT_TOKEN_DEFAULT,
  SIZE_INPUT_UI_KEY,
  USDC_MINT,
} from '../../utils/constants'
import { useTokenMax } from './useTokenMax'
import HealthImpact from '@components/shared/HealthImpact'
import { useWallet } from '@solana/wallet-adapter-react'
import useMangoAccount from 'hooks/useMangoAccount'
import { RouteInfo } from 'types/jupiter'
import useMangoGroup from 'hooks/useMangoGroup'
import useLocalStorageState from 'hooks/useLocalStorageState'
import SwapSlider from './SwapSlider'
import TokenVaultWarnings from '@components/shared/TokenVaultWarnings'
import MaxSwapAmount from './MaxSwapAmount'
import PercentageSelectButtons from './PercentageSelectButtons'
import useIpAddress from 'hooks/useIpAddress'
import { useEnhancedWallet } from '@components/wallet/EnhancedWalletProvider'
import SwapSettings from './SwapSettings'

const MAX_DIGITS = 11
export const withValueLimit = (values: NumberFormatValues): boolean => {
  return values.floatValue
    ? values.floatValue.toFixed(0).length <= MAX_DIGITS
    : true
}

const set = mangoStore.getState().set

const SwapForm = () => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo>()
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [showTokenSelect, setShowTokenSelect] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { group } = useMangoGroup()
  const [swapFormSizeUi] = useLocalStorageState(SIZE_INPUT_UI_KEY, 'Slider')
  const { ipAllowed, ipCountry } = useIpAddress()

  const {
    margin: useMargin,
    slippage,
    inputBank,
    outputBank,
    amountIn: amountInFormValue,
    amountOut: amountOutFormValue,
    swapMode,
  } = mangoStore((s) => s.swap)
  const [debouncedAmountIn] = useDebounce(amountInFormValue, 300)
  const [debouncedAmountOut] = useDebounce(amountOutFormValue, 300)
  const { mangoAccount } = useMangoAccount()
  const { connected } = useWallet()

  const amountInAsDecimal: Decimal | null = useMemo(() => {
    return Number(debouncedAmountIn)
      ? new Decimal(debouncedAmountIn)
      : new Decimal(0)
  }, [debouncedAmountIn])

  const amountOutAsDecimal: Decimal | null = useMemo(() => {
    return Number(debouncedAmountOut)
      ? new Decimal(debouncedAmountOut)
      : new Decimal(0)
  }, [debouncedAmountOut])

  const { bestRoute, routes } = useJupiterRoutes({
    inputMint: inputBank?.mint.toString() || USDC_MINT,
    outputMint: outputBank?.mint.toString() || MANGO_MINT,
    amount: swapMode === 'ExactIn' ? debouncedAmountIn : debouncedAmountOut,
    slippage,
    swapMode,
  })

  const setAmountInFormValue = useCallback(
    (amountIn: string, setSwapMode?: boolean) => {
      set((s) => {
        s.swap.amountIn = amountIn
        if (!parseFloat(amountIn)) {
          s.swap.amountOut = ''
        }
        if (setSwapMode) {
          s.swap.swapMode = 'ExactIn'
        }
      })
    },
    []
  )

  const setAmountOutFormValue = useCallback((amountOut: string) => {
    set((s) => {
      s.swap.amountOut = amountOut
      if (!parseFloat(amountOut)) {
        s.swap.amountIn = ''
      }
    })
  }, [])

  /* 
    Once a route is returned from the Jupiter API, use the inAmount or outAmount
    depending on the swapMode and set those values in state
  */
  useEffect(() => {
    if (bestRoute) {
      setSelectedRoute(bestRoute)

      if (inputBank && swapMode === 'ExactOut') {
        const inAmount = new Decimal(bestRoute.inAmount)
          .div(10 ** inputBank.mintDecimals)
          .toString()
        setAmountInFormValue(inAmount)
      } else if (outputBank && swapMode === 'ExactIn') {
        const outAmount = new Decimal(bestRoute.outAmount)
          .div(10 ** outputBank.mintDecimals)
          .toString()
        setAmountOutFormValue(outAmount)
      }
    }
  }, [bestRoute, swapMode, inputBank, outputBank])

  /* 
    If the use margin setting is toggled, clear the form values
  */
  useEffect(() => {
    setAmountInFormValue('')
    setAmountOutFormValue('')
  }, [useMargin, setAmountInFormValue, setAmountOutFormValue])

  const handleAmountInChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      if (swapMode === 'ExactOut') {
        set((s) => {
          s.swap.swapMode = 'ExactIn'
        })
      }
      setAmountInFormValue(e.value)
    },
    [swapMode, setAmountInFormValue]
  )

  const handleAmountOutChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      if (swapMode === 'ExactIn') {
        set((s) => {
          s.swap.swapMode = 'ExactOut'
        })
      }
      setAmountOutFormValue(e.value)
    },
    [swapMode, setAmountOutFormValue]
  )

  const handleTokenInSelect = useCallback((mintAddress: string) => {
    const group = mangoStore.getState().group
    if (group) {
      const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
      set((s) => {
        s.swap.inputBank = bank
      })
    }
    setShowTokenSelect('')
  }, [])

  const handleTokenOutSelect = useCallback((mintAddress: string) => {
    const group = mangoStore.getState().group
    if (group) {
      const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
      set((s) => {
        s.swap.outputBank = bank
      })
    }
    setShowTokenSelect('')
  }, [])

  const handleSwitchTokens = useCallback(() => {
    if (amountInAsDecimal?.gt(0) && amountOutAsDecimal.gte(0)) {
      setAmountInFormValue(amountOutAsDecimal.toString())
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
  }, [setAmountInFormValue, amountOutAsDecimal, amountInAsDecimal])

  const maintProjectedHealth = useMemo(() => {
    const group = mangoStore.getState().group
    if (
      !inputBank ||
      !mangoAccount ||
      !outputBank ||
      !amountOutAsDecimal ||
      !group
    )
      return 0

    const simulatedHealthRatio =
      mangoAccount.simHealthRatioWithTokenPositionUiChanges(
        group,
        [
          {
            mintPk: inputBank.mint,
            uiTokenAmount: amountInAsDecimal.toNumber() * -1,
          },
          {
            mintPk: outputBank.mint,
            uiTokenAmount: amountOutAsDecimal.toNumber(),
          },
        ],
        HealthType.maint
      )
    return simulatedHealthRatio > 100
      ? 100
      : simulatedHealthRatio < 0
      ? 0
      : Math.trunc(simulatedHealthRatio)
  }, [
    mangoAccount,
    inputBank,
    outputBank,
    amountInAsDecimal,
    amountOutAsDecimal,
  ])

  const loadingSwapDetails: boolean = useMemo(() => {
    return (
      !!(amountInAsDecimal.toNumber() || amountOutAsDecimal.toNumber()) &&
      connected &&
      !selectedRoute
    )
  }, [amountInAsDecimal, amountOutAsDecimal, connected, selectedRoute])

  return (
    <ContentBox
      hidePadding
      className="relative overflow-hidden border-x-0 md:border-l md:border-r-0 md:border-t-0 md:border-b-0"
    >
      <div>
        <Transition
          className="absolute top-0 left-0 z-10 h-full w-full bg-th-bkg-1 pb-0"
          show={showConfirm}
          enter="transition ease-in duration-300"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-out duration-300"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <SwapReviewRouteInfo
            onClose={() => setShowConfirm(false)}
            amountIn={amountInAsDecimal}
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
        <div className="relative p-6 pt-10">
          <div className="absolute right-4 top-4">
            <IconButton
              className="text-th-fgd-3"
              hideBg
              onClick={() => setShowSettings(true)}
            >
              <Cog8ToothIcon className="h-5 w-5" />
            </IconButton>
          </div>
          <div className="mb-2 flex items-end justify-between">
            <p className="text-th-fgd-2 lg:text-base">{t('swap:pay')}</p>
            <MaxSwapAmount
              useMargin={useMargin}
              setAmountIn={(v) => setAmountInFormValue(v, true)}
            />
          </div>
          <div className="mb-3 grid grid-cols-2" id="swap-step-two">
            <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-input-border bg-th-input-bkg">
              <TokenSelect
                bank={
                  inputBank ||
                  group?.banksMapByName.get(INPUT_TOKEN_DEFAULT)?.[0]
                }
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
                className="w-full rounded-l-none rounded-r-lg border border-th-input-border bg-th-input-bkg p-3 text-right font-mono text-base font-bold text-th-fgd-1 focus:outline-none lg:text-lg xl:text-xl"
                placeholder="0.00"
                value={amountInFormValue}
                onValueChange={handleAmountInChange}
                isAllowed={withValueLimit}
              />
            </div>
          </div>
          <div className="-mb-2 flex justify-center">
            <button
              className="rounded-full border border-th-bkg-4 p-1.5 text-th-fgd-3 md:hover:text-th-active"
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
          <p className="mb-2 text-th-fgd-2 lg:text-base">{t('swap:receive')}</p>
          <div id="swap-step-three" className="mb-3 grid grid-cols-2">
            <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-input-border bg-th-input-bkg">
              <TokenSelect
                bank={
                  outputBank ||
                  group?.banksMapByName.get(OUTPUT_TOKEN_DEFAULT)?.[0]
                }
                showTokenList={setShowTokenSelect}
                type="output"
              />
            </div>
            <div className="flex h-[54px] w-full items-center justify-end rounded-r-lg border border-th-input-border text-right text-lg font-bold text-th-fgd-3 xl:text-xl">
              {loadingSwapDetails ? (
                <div className="w-full">
                  <SheenLoader className="flex flex-1 rounded-l-none">
                    <div className="h-[52px] w-full rounded-r-lg bg-th-bkg-4" />
                  </SheenLoader>
                </div>
              ) : (
                <NumberFormat
                  inputMode="decimal"
                  thousandSeparator=","
                  allowNegative={false}
                  isNumericString={true}
                  decimalScale={outputBank?.mintDecimals || 6}
                  name="amountOut"
                  id="amountOut"
                  className="w-full rounded-l-none rounded-r-lg bg-th-input-bkg p-3 text-right font-mono text-base font-bold text-th-fgd-1 focus:outline-none lg:text-lg xl:text-xl"
                  placeholder="0.00"
                  value={amountOutFormValue}
                  onValueChange={handleAmountOutChange}
                />
              )}
            </div>
          </div>
          {swapFormSizeUi === 'slider' ? (
            <SwapSlider
              useMargin={useMargin}
              amount={amountInAsDecimal.toNumber()}
              onChange={(v) => setAmountInFormValue(v, true)}
              step={1 / 10 ** (inputBank?.mintDecimals || 6)}
            />
          ) : (
            <PercentageSelectButtons
              amountIn={amountInAsDecimal.toString()}
              setAmountIn={(v) => setAmountInFormValue(v, true)}
              useMargin={useMargin}
            />
          )}
          {ipAllowed ? (
            <SwapFormSubmitButton
              loadingSwapDetails={loadingSwapDetails}
              useMargin={useMargin}
              selectedRoute={selectedRoute}
              setShowConfirm={setShowConfirm}
              amountIn={amountInAsDecimal}
              inputSymbol={inputBank?.name}
              amountOut={
                selectedRoute ? amountOutAsDecimal.toNumber() : undefined
              }
            />
          ) : (
            <Button
              disabled
              className="mt-6 mb-4 w-full leading-tight"
              size="large"
            >
              {t('country-not-allowed', {
                country: ipCountry ? `(${ipCountry})` : '',
              })}
            </Button>
          )}
          {group && inputBank ? (
            <TokenVaultWarnings bank={inputBank} type="swap" />
          ) : null}
          <div className="space-y-2">
            <div id="swap-step-four">
              <HealthImpact maintProjectedHealth={maintProjectedHealth} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-th-fgd-3">{t('swap:max-slippage')}</p>
              <div className="flex items-center space-x-1">
                <p className="text-right font-mono text-sm text-th-fgd-2">
                  {slippage}%
                </p>
                <IconButton
                  className="text-th-fgd-3"
                  hideBg
                  onClick={() => setShowSettings(true)}
                >
                  <PencilIcon className="ml-2 h-4 w-4" />
                </IconButton>
              </div>
            </div>
          </div>
        </div>
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
  selectedRoute,
  setShowConfirm,
  useMargin,
}: {
  amountIn: Decimal
  amountOut: number | undefined
  inputSymbol: string | undefined
  loadingSwapDetails: boolean
  selectedRoute: RouteInfo | undefined
  setShowConfirm: (x: boolean) => void
  useMargin: boolean
}) => {
  const { t } = useTranslation('common')
  const { connected } = useWallet()
  const { amount: tokenMax, amountWithBorrow } = useTokenMax(useMargin)
  const { handleConnect } = useEnhancedWallet()

  const showInsufficientBalance = useMargin
    ? amountWithBorrow.lt(amountIn)
    : tokenMax.lt(amountIn)

  const disabled =
    connected &&
    (!amountIn.toNumber() ||
      showInsufficientBalance ||
      !amountOut ||
      !selectedRoute)

  const onClick = connected ? () => setShowConfirm(true) : handleConnect

  return (
    <Button
      onClick={onClick}
      className="mt-6 mb-4 flex w-full items-center justify-center text-base"
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
        ) : (
          <span>{t('swap:review-swap')}</span>
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
