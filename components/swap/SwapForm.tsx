import { useState, useCallback, useEffect, useMemo } from 'react'
import { PublicKey } from '@solana/web3.js'
import {
  ArrowDownIcon,
  Cog8ToothIcon,
  ExclamationCircleIcon,
  LinkIcon,
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
import Button, { IconButton, LinkButton } from '../shared/Button'
import Loading from '../shared/Loading'
import { EnterBottomExitBottom } from '../shared/Transitions'
import useQuoteRoutes from './useQuoteRoutes'
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
import InlineNotification from '@components/shared/InlineNotification'
import useUnownedAccount from 'hooks/useUnownedAccount'
import Tooltip from '@components/shared/Tooltip'
import TabUnderline from '@components/shared/TabUnderline'
import Select from '@components/forms/Select'

const MAX_DIGITS = 11
export const withValueLimit = (values: NumberFormatValues): boolean => {
  return values.floatValue
    ? values.floatValue.toFixed(0).length <= MAX_DIGITS
    : true
}

const NUMBER_FORMAT_CLASSNAMES =
  'w-full rounded-lg rounded-l-none h-[54px] border-l border-th-bkg-2 bg-th-input-bkg p-3 text-right font-mono text-xl text-th-fgd-1 focus:outline-none md:hover:border-th-input-border-hover focus-visible:bg-th-bkg-3'

const set = mangoStore.getState().set

export const ORDER_TYPES = [
  'trade:limit',
  'trade:stop-market',
  'trade:stop-limit',
]

const SwapForm = () => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  //initial state is undefined null is returned on error
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>()
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [showTokenSelect, setShowTokenSelect] = useState<'input' | 'output'>()
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [orderType, setOrderType] = useState(ORDER_TYPES[0])
  const [activeTab, setActiveTab] = useState('swap')
  const [limitPrice, setLimitPrice] = useState('')
  const [triggerPrice, setTriggerPrice] = useState('')
  const { group } = useMangoGroup()
  const [swapFormSizeUi] = useLocalStorageState(SIZE_INPUT_UI_KEY, 'slider')
  const { ipAllowed, ipCountry } = useIpAddress()
  const { isUnownedAccount } = useUnownedAccount()

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
  const { isDelegatedAccount } = useUnownedAccount()
  const { connected, publicKey } = useWallet()

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

  const { bestRoute, routes } = useQuoteRoutes({
    inputMint: inputBank?.mint.toString() || USDC_MINT,
    outputMint: outputBank?.mint.toString() || MANGO_MINT,
    amount: swapMode === 'ExactIn' ? debouncedAmountIn : debouncedAmountOut,
    slippage,
    swapMode,
    wallet: publicKey?.toBase58(),
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
    if (typeof bestRoute !== 'undefined') {
      setSelectedRoute(bestRoute)

      if (inputBank && swapMode === 'ExactOut' && bestRoute) {
        const inAmount = new Decimal(bestRoute!.inAmount)
          .div(10 ** inputBank.mintDecimals)
          .toString()
        setAmountInFormValue(inAmount)
      } else if (outputBank && swapMode === 'ExactIn' && bestRoute) {
        const outAmount = new Decimal(bestRoute!.outAmount)
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

  const handleLimitPrice = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setLimitPrice(e.value)
    },
    [setLimitPrice]
  )

  const handleTriggerPrice = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setTriggerPrice(e.value)
    },
    [setTriggerPrice]
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
    setShowTokenSelect(undefined)
  }, [])

  const handleTokenOutSelect = useCallback((mintAddress: string) => {
    const group = mangoStore.getState().group
    if (group) {
      const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
      set((s) => {
        s.swap.outputBank = bank
      })
    }
    setShowTokenSelect(undefined)
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
      typeof selectedRoute === 'undefined'
    )
  }, [amountInAsDecimal, amountOutAsDecimal, connected, selectedRoute])

  return (
    <ContentBox
      hidePadding
      className="relative overflow-hidden border-x-0 bg-th-bkg-1 md:border-l md:border-r-0 md:border-t-0 md:border-b-0"
    >
      <div>
        <Transition
          className="absolute top-0 right-0 z-10 h-full w-full bg-th-bkg-1 pb-0"
          show={showConfirm}
          enter="transition ease-in duration-300"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-out duration-300"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
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
            onClose={() => setShowTokenSelect(undefined)}
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
        <div className="relative p-6">
          <div className="mb-6">
            <TabUnderline
              activeValue={activeTab}
              values={['swap', 'trade:limit']}
              onChange={(v) => setActiveTab(v)}
            />
          </div>
          <div className="absolute right-4 top-4">
            <IconButton
              className="text-th-fgd-3"
              hideBg
              onClick={() => setShowSettings(true)}
            >
              <Cog8ToothIcon className="h-5 w-5" />
            </IconButton>
          </div>
          <div
            className={`grid grid-cols-2 ${
              activeTab === 'trade:limit' ? 'rounded-t-xl' : 'rounded-xl'
            } bg-th-bkg-2 p-3`}
            id="swap-step-two"
          >
            <div className="col-span-2 mb-2 flex items-center justify-between">
              <p className="text-th-fgd-2">{t('sell')}</p>
              {!isUnownedAccount ? (
                <MaxSwapAmount
                  useMargin={useMargin}
                  setAmountIn={(v) => setAmountInFormValue(v, true)}
                />
              ) : null}
            </div>
            <div className="col-span-1">
              <TokenSelect
                bank={
                  inputBank ||
                  group?.banksMapByName.get(INPUT_TOKEN_DEFAULT)?.[0]
                }
                showTokenList={setShowTokenSelect}
                type="input"
              />
            </div>
            <div className="col-span-1">
              <NumberFormat
                inputMode="decimal"
                thousandSeparator=","
                allowNegative={false}
                isNumericString={true}
                decimalScale={inputBank?.mintDecimals || 6}
                name="amountIn"
                id="amountIn"
                className={NUMBER_FORMAT_CLASSNAMES}
                placeholder="0.00"
                value={amountInFormValue}
                onValueChange={handleAmountInChange}
                isAllowed={withValueLimit}
              />
            </div>
          </div>
          {activeTab === 'trade:limit' ? (
            <div
              className={`grid ${
                orderType === 'trade:stop-limit' ? 'grid-cols-3' : 'grid-cols-2'
              } gap-2 rounded-b-xl bg-th-bkg-2 p-3 pt-1`}
              id="swap-step-two"
            >
              <div className="col-span-1">
                <p className="mb-2 text-th-fgd-2">{t('trade:order-type')}</p>
                <Select
                  value={t(orderType)}
                  onChange={(type) => setOrderType(type)}
                  className="w-full"
                  buttonClassName="ring-0 rounded-t-lg rounded-b-lg"
                >
                  {ORDER_TYPES.map((type) => (
                    <Select.Option key={type} value={type}>
                      {t(type)}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              {orderType !== 'trade:limit' ? (
                <div className="col-span-1">
                  <p className="mb-2 text-th-fgd-2">
                    {t('trade:trigger-price')}
                  </p>
                  <NumberFormat
                    inputMode="decimal"
                    thousandSeparator=","
                    allowNegative={false}
                    isNumericString={true}
                    decimalScale={outputBank?.mintDecimals || 6}
                    name="triggerPrice"
                    id="triggerPrice"
                    className="h-10 w-full rounded-lg bg-th-input-bkg p-3 text-right font-mono text-sm text-th-fgd-1 focus:border-th-fgd-4 focus:outline-none md:hover:border-th-input-border-hover md:hover:focus-visible:bg-th-bkg-3"
                    placeholder="0.00"
                    value={triggerPrice}
                    onValueChange={handleTriggerPrice}
                    isAllowed={withValueLimit}
                  />
                </div>
              ) : null}
              {orderType !== 'trade:stop-market' ? (
                <div className="col-span-1">
                  <p className="mb-2 text-th-fgd-2">{t('trade:limit-price')}</p>
                  <NumberFormat
                    inputMode="decimal"
                    thousandSeparator=","
                    allowNegative={false}
                    isNumericString={true}
                    decimalScale={outputBank?.mintDecimals || 6}
                    name="limitPrice"
                    id="limitPrice"
                    className="h-10 w-full rounded-lg bg-th-input-bkg p-3 text-right font-mono text-sm text-th-fgd-1 focus:border-th-fgd-4 focus:outline-none md:hover:border-th-input-border-hover md:hover:focus-visible:bg-th-bkg-3"
                    placeholder="0.00"
                    value={limitPrice}
                    onValueChange={handleLimitPrice}
                    isAllowed={withValueLimit}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="my-2 flex justify-center">
            <button
              className="rounded-full border border-th-fgd-4 p-1.5 text-th-fgd-3 focus-visible:border-th-active md:hover:border-th-active md:hover:text-th-active"
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
          <div
            id="swap-step-three"
            className="mb-3 grid grid-cols-2 rounded-xl bg-th-bkg-2 p-3"
          >
            <p className="col-span-2 mb-2 text-th-fgd-2">{t('buy')}</p>
            <div className="col-span-1">
              <TokenSelect
                bank={
                  outputBank ||
                  group?.banksMapByName.get(OUTPUT_TOKEN_DEFAULT)?.[0]
                }
                showTokenList={setShowTokenSelect}
                type="output"
              />
            </div>
            <div className="col-span-1">
              {loadingSwapDetails ? (
                <div className="flex w-full items-center justify-center rounded-l-none rounded-r-lg border border-th-input-border bg-th-bkg-2">
                  <Loading />
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
                  className={NUMBER_FORMAT_CLASSNAMES}
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
              isDelegatedAccount={isDelegatedAccount}
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
          {inputBank &&
          inputBank.areBorrowsReduceOnly() &&
          inputBank.areDepositsReduceOnly() ? (
            <div className="pb-4">
              <InlineNotification
                type="warning"
                desc={t('swap:input-reduce-only-warning', {
                  symbol: inputBank.name,
                })}
              />
            </div>
          ) : null}
          {outputBank &&
          outputBank.areBorrowsReduceOnly() &&
          outputBank.areDepositsReduceOnly() ? (
            <div className="pb-4">
              <InlineNotification
                type="warning"
                desc={t('swap:output-reduce-only-warning', {
                  symbol: outputBank.name,
                })}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <div id="swap-step-four">
              <HealthImpact maintProjectedHealth={maintProjectedHealth} />
            </div>
            <div className="flex items-center justify-between">
              <Tooltip content={t('swap:tooltip-margin')}>
                <p className="tooltip-underline text-sm text-th-fgd-3">
                  {t('swap:margin')}
                </p>
              </Tooltip>
              <LinkButton
                className="text-right text-sm font-normal text-th-fgd-2 underline underline-offset-2 md:hover:no-underline"
                onClick={() => setShowSettings(true)}
              >
                {useMargin ? t('swap:enabled') : t('swap:disabled')}
              </LinkButton>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-th-fgd-3">{t('swap:max-slippage')}</p>
              <LinkButton
                className="text-right font-mono text-sm font-normal text-th-fgd-2 underline underline-offset-2 md:hover:no-underline"
                onClick={() => setShowSettings(true)}
              >
                {slippage}%
              </LinkButton>
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
  isDelegatedAccount,
}: {
  amountIn: Decimal
  amountOut: number | undefined
  inputSymbol: string | undefined
  loadingSwapDetails: boolean
  selectedRoute: RouteInfo | undefined | null
  setShowConfirm: (x: boolean) => void
  useMargin: boolean
  isDelegatedAccount: boolean
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
      !selectedRoute ||
      isDelegatedAccount)

  const onClick = connected ? () => setShowConfirm(true) : handleConnect

  return (
    <>
      <Button
        onClick={onClick}
        className="mt-6 mb-4 flex w-full items-center justify-center text-base"
        disabled={disabled}
        size="large"
      >
        {isDelegatedAccount ? (
          <div>Swap Unavailable for Delegates</div>
        ) : connected ? (
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
      {selectedRoute === null && amountIn.gt(0) ? (
        <div className="mb-4">
          <InlineNotification type="error" desc={t('swap:no-swap-found')} />
        </div>
      ) : null}
    </>
  )
}
