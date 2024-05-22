import mangoStore from '@store/mangoStore'
import NumberFormat, {
  NumberFormatValues,
  SourceInfo,
} from 'react-number-format'
import {
  DEFAULT_CHECKBOX_SETTINGS,
  INPUT_PREFIX_CLASSNAMES,
  INPUT_SUFFIX_CLASSNAMES,
} from './AdvancedTradeForm'
import LogoWithFallback from '@components/shared/LogoWithFallback'
import { LinkIcon, QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useWallet } from '@solana/wallet-adapter-react'
import useIpAddress from 'hooks/useIpAddress'
import { useTranslation } from 'next-i18next'
import { FormEvent, useCallback, useMemo, useState } from 'react'
import Loading from '@components/shared/Loading'
import Button from '@components/shared/Button'
import Image from 'next/image'
import useQuoteRoutes from '@components/swap/useQuoteRoutes'
import {
  HealthType,
  PerpMarket,
  Serum3Market,
  TransactionErrors,
  parseTxForKnownErrors,
} from '@blockworks-foundation/mango-v4'
import Decimal from 'decimal.js'
import { notify } from 'utils/notifications'
import * as sentry from '@sentry/nextjs'
import { isMangoError } from 'types'
import SwapSlider from '@components/swap/SwapSlider'
import PercentageSelectButtons from '@components/swap/PercentageSelectButtons'
import { SIZE_INPUT_UI_KEY, TRADE_CHECKBOXES_KEY } from 'utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useUnownedAccount from 'hooks/useUnownedAccount'
import HealthImpact from '@components/shared/HealthImpact'
import Tooltip from '@components/shared/Tooltip'
import Checkbox from '@components/forms/Checkbox'
// import MaxMarketSwapAmount from './MaxMarketSwapAmount'
import {
  floorToDecimal,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import { formatTokenSymbol } from 'utils/tokens'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { useTokenMax } from '@components/swap/useTokenMax'
import SheenLoader from '@components/shared/SheenLoader'
import { fetchJupiterTransaction } from '@components/swap/SwapReviewRouteInfo'
import MaxMarketTradeAmount from './MaxMarketTradeAmount'
import useMangoAccount from 'hooks/useMangoAccount'
import InlineNotification from '@components/shared/InlineNotification'
import { debounce } from 'lodash'
import { isTokenInsured } from '@components/DepositForm'
import UninsuredNotification from '@components/shared/UninsuredNotification'

const set = mangoStore.getState().set

function stringToNumberOrZero(s: string): number {
  const n = parseFloat(s)
  if (isNaN(n)) {
    return 0
  }
  return n
}

export default function SpotMarketOrderSwapForm() {
  const { t } = useTranslation()
  const { baseSize, quoteSize, side } = mangoStore((s) => s.tradeForm)
  const { isUnownedAccount } = useUnownedAccount()
  const [placingOrder, setPlacingOrder] = useState(false)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)
  const { ipAllowed, ipCountry } = useIpAddress()
  const { connected, publicKey, connect } = useWallet()
  const { mangoAccount } = useMangoAccount()
  const [swapFormSizeUi] = useLocalStorageState(SIZE_INPUT_UI_KEY, 'slider')
  const [savedCheckboxSettings, setSavedCheckboxSettings] =
    useLocalStorageState(TRADE_CHECKBOXES_KEY, DEFAULT_CHECKBOX_SETTINGS)
  const {
    price: oraclePrice,
    baseLogoURI,
    baseSymbol,
    quoteLogoURI,
    quoteSymbol,
    selectedMarket,
    serumOrPerpMarket,
  } = useSelectedMarket()
  const { amount: tokenMax, amountWithBorrow } = useTokenMax()

  const [inputBank, outputBank] = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !(selectedMarket instanceof Serum3Market)) return []

    const quoteBank = group?.getFirstBankByTokenIndex(
      selectedMarket.quoteTokenIndex,
    )
    const baseBank = group.getFirstBankByTokenIndex(
      selectedMarket.baseTokenIndex,
    )

    if (side === 'buy') {
      set((s) => {
        s.swap.inputBank = quoteBank
        s.swap.outputBank = baseBank
      })
      return [quoteBank, baseBank]
    } else {
      set((s) => {
        s.swap.inputBank = baseBank
        s.swap.outputBank = quoteBank
      })
      return [baseBank, quoteBank]
    }
  }, [selectedMarket, side])

  const isInsured = useMemo(() => {
    const group = mangoStore.getState().group
    return isTokenInsured(outputBank, group)
  }, [outputBank])

  const handleBaseSizeChange = useCallback(
    debounce((e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      set((s) => {
        s.tradeForm.baseSize = e.value
        if (oraclePrice && e.value !== '' && !Number.isNaN(Number(e.value))) {
          s.tradeForm.quoteSize = new Decimal(oraclePrice)
            .mul(e.value)
            .toFixed()
        } else {
          s.tradeForm.quoteSize = ''
        }
      })
    }, 500),
    [oraclePrice],
  )

  const handleQuoteSizeChange = useCallback(
    debounce((e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      set((s) => {
        s.tradeForm.quoteSize = e.value
        if (oraclePrice && e.value !== '' && !Number.isNaN(Number(e.value))) {
          s.tradeForm.baseSize = new Decimal(e.value).div(oraclePrice).toFixed()
        } else {
          s.tradeForm.baseSize = ''
        }
      })
    }, 500),
    [oraclePrice],
  )

  const handleMaxAmount = useCallback(
    (useMargin: boolean) => {
      const group = mangoStore.getState().group
      if (
        !group ||
        !serumOrPerpMarket ||
        serumOrPerpMarket instanceof PerpMarket
      )
        return { max: new Decimal(0), decimals: 6 }

      const max = useMargin ? amountWithBorrow : tokenMax
      const decimals = getDecimalCount(serumOrPerpMarket.minOrderSize)
      if (side === 'sell') {
        return { max, decimals }
      } else {
        const baseMax = max.div(new Decimal(oraclePrice))
        return { max: baseMax, decimals }
      }
    },
    [amountWithBorrow, oraclePrice, serumOrPerpMarket, side, tokenMax],
  )

  const setMaxFromButton = useCallback(
    (amount: string) => {
      handleBaseSizeChange(
        { value: amount } as NumberFormatValues,
        { source: 'event' } as SourceInfo,
      )
    },
    [handleBaseSizeChange],
  )

  const handleSliderDrag = useCallback(() => {
    if (!isDraggingSlider) {
      setIsDraggingSlider(true)
    }
  }, [isDraggingSlider])

  const handleSliderDragEnd = useCallback(() => {
    if (isDraggingSlider) {
      setIsDraggingSlider(false)
    }
  }, [isDraggingSlider])

  const setAmountFromSlider = useCallback(
    (amount: string) => {
      if (side === 'buy') {
        handleQuoteSizeChange(
          { value: amount } as NumberFormatValues,
          { source: 'event' } as SourceInfo,
        )
      } else {
        handleBaseSizeChange(
          { value: amount } as NumberFormatValues,
          { source: 'event' } as SourceInfo,
        )
      }
    },
    [side, handleBaseSizeChange, handleQuoteSizeChange],
  )

  const slippage = mangoStore.getState().swap.slippage
  const jupiterQuoteAmount = side === 'buy' ? quoteSize : baseSize
  const roundedQuoteAmount = useMemo(() => {
    if (!jupiterQuoteAmount) return ''
    return new Decimal(jupiterQuoteAmount)
      .toDecimalPlaces(inputBank?.mintDecimals || 6, Decimal.ROUND_FLOOR)
      .toFixed()
  }, [jupiterQuoteAmount, inputBank])

  const { bestRoute: selectedRoute, isInitialLoading: loadingRoute } =
    useQuoteRoutes({
      inputMint: inputBank?.mint.toString() || '',
      outputMint: outputBank?.mint.toString() || '',
      amount: roundedQuoteAmount,
      slippage,
      swapMode: 'ExactIn',
      wallet: publicKey?.toBase58(),
      mangoAccount,
      routingMode: 'ALL_AND_JUPITER_DIRECT',
      enabled: () =>
        !!(
          inputBank?.mint &&
          outputBank?.mint &&
          jupiterQuoteAmount &&
          !isDraggingSlider
        ),
    })

  const handlePlaceOrder = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const { baseSize, quoteSize, side } = mangoStore.getState().tradeForm
    const actions = mangoStore.getState().actions
    const connection = mangoStore.getState().connection

    if (
      !mangoAccount ||
      !group ||
      !inputBank ||
      !outputBank ||
      !publicKey ||
      !selectedRoute
    )
      return

    setPlacingOrder(true)
    const [ixs, alts] =
      // selectedRoute.routerName === 'Mango'
      //   ? await prepareMangoRouterInstructions(
      //       selectedRoute,
      //       inputBank.mint,
      //       outputBank.mint,
      //       mangoAccount.owner,
      //     )
      // :
      selectedRoute.instructions
        ? [selectedRoute.instructions, []]
        : await fetchJupiterTransaction(
            connection,
            selectedRoute,
            publicKey,
            slippage,
            inputBank.mint,
            outputBank.mint,
            selectedRoute.origin,
          )

    try {
      const { signature: tx, slot } = await client.marginTrade({
        group,
        mangoAccount,
        inputMintPk: inputBank.mint,
        amountIn:
          side === 'buy'
            ? stringToNumberOrZero(quoteSize)
            : stringToNumberOrZero(baseSize),
        outputMintPk: outputBank.mint,
        userDefinedInstructions: ixs,
        userDefinedAlts: alts,
        flashLoanType: { swap: {} },
      })
      set((s) => {
        s.successAnimation.swap = true
      })
      // if (soundSettings['swap-success']) {
      //   successSound.play()
      // }
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
        noSound: true,
      })
      actions.fetchGroup()
      actions.fetchSwapHistory(mangoAccount.publicKey.toString(), 30000)
      await actions.reloadMangoAccount(slot)
      set((s) => {
        s.tradeForm.baseSize = ''
        s.tradeForm.quoteSize = ''
      })
    } catch (e) {
      console.error('onSwap error: ', e)
      sentry.captureException(e)
      if (isMangoError(e)) {
        const slippageExceeded = await parseTxForKnownErrors(
          connection,
          e?.txid,
        )
        if (
          slippageExceeded ===
          TransactionErrors.JupiterSlippageToleranceExceeded
        ) {
          notify({
            title: t('swap:error-slippage-exceeded'),
            description: t('swap:error-slippage-exceeded-desc'),
            txid: e?.txid,
            type: 'error',
          })
        } else {
          notify({
            title: 'Transaction failed',
            description: e.message,
            txid: e?.txid,
            type: 'error',
          })
        }
      } else {
        notify({
          title: 'Transaction failed',
          description: `${e} - please try again`,
          type: 'error',
        })
      }
    } finally {
      setPlacingOrder(false)
    }
  }, [inputBank, outputBank, publicKey, selectedRoute])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    connected ? handlePlaceOrder() : connect()
  }

  const maintProjectedHealth = useMemo(() => {
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!inputBank || !mangoAccount || !outputBank || !group) return 0

    const simulatedHealthRatio =
      mangoAccount.simHealthRatioWithTokenPositionUiChanges(
        group,
        [
          {
            mintPk: inputBank.mint,
            uiTokenAmount:
              (side === 'buy'
                ? stringToNumberOrZero(quoteSize)
                : stringToNumberOrZero(baseSize)) * -1,
          },
          {
            mintPk: outputBank.mint,
            uiTokenAmount:
              side === 'buy'
                ? stringToNumberOrZero(baseSize)
                : stringToNumberOrZero(quoteSize),
          },
        ],
        HealthType.maint,
      )
    return simulatedHealthRatio > 100
      ? 100
      : simulatedHealthRatio < 0
      ? 0
      : Math.trunc(simulatedHealthRatio)
  }, [inputBank, outputBank, baseSize, quoteSize, side])

  const [balance, borrowAmount] = useMemo(() => {
    if (!inputBank) return [0, 0]
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!mangoAccount) return [0, 0]
    let borrowAmount
    const balance = mangoAccount.getTokenDepositsUi(inputBank)
    if (side === 'buy') {
      const remainingBalance = balance - parseFloat(quoteSize)
      borrowAmount = remainingBalance < 0 ? Math.abs(remainingBalance) : 0
    } else {
      const remainingBalance = balance - parseFloat(baseSize)
      borrowAmount = remainingBalance < 0 ? Math.abs(remainingBalance) : 0
    }

    return [balance, borrowAmount]
  }, [baseSize, inputBank, quoteSize])

  const orderValue = useMemo(() => {
    if (
      !inputBank ||
      !outputBank ||
      !oraclePrice ||
      !baseSize ||
      isNaN(parseFloat(baseSize))
    )
      return 0

    const quotePriceDecimal =
      side === 'buy'
        ? new Decimal(inputBank.uiPrice)
        : new Decimal(outputBank.uiPrice)
    const basePriceDecimal = new Decimal(oraclePrice)
    const sizeDecimal = new Decimal(baseSize)
    return floorToDecimal(
      basePriceDecimal.mul(quotePriceDecimal).mul(sizeDecimal),
      2,
    )
  }, [baseSize, inputBank, outputBank, oraclePrice, side])

  const tooMuchSize = useMemo(() => {
    if (!baseSize || !quoteSize || !amountWithBorrow || !tokenMax) return false
    const size = side === 'buy' ? new Decimal(quoteSize) : new Decimal(baseSize)
    const useMargin = savedCheckboxSettings.margin
    return useMargin ? size.gt(amountWithBorrow) : size.gt(tokenMax)
  }, [
    amountWithBorrow,
    baseSize,
    quoteSize,
    side,
    tokenMax,
    savedCheckboxSettings.margin,
  ])

  const quoteError =
    !!selectedRoute?.error ||
    !!(
      !selectedRoute &&
      !loadingRoute &&
      !isDraggingSlider &&
      jupiterQuoteAmount
    )

  const disabled =
    (connected && (!baseSize || !oraclePrice)) ||
    !serumOrPerpMarket ||
    loadingRoute ||
    tooMuchSize ||
    quoteError

  return (
    <>
      <form onSubmit={(e) => handleSubmit(e)}>
        <div className="mt-3 px-3 md:px-4">
          <div className="mb-2 mt-3 flex items-center justify-between">
            <p className="text-xs text-th-fgd-3">{t('trade:size')}</p>
            {!isUnownedAccount ? (
              <MaxMarketTradeAmount
                useMargin={savedCheckboxSettings.margin}
                setAmountIn={setMaxFromButton}
                maxAmount={handleMaxAmount}
              />
            ) : null}
          </div>
          <div className="flex flex-col">
            <div className="relative">
              <NumberFormat
                inputMode="decimal"
                thousandSeparator=","
                allowNegative={false}
                isNumericString={true}
                decimalScale={
                  side === 'buy'
                    ? outputBank?.mintDecimals
                    : inputBank?.mintDecimals
                }
                name="base"
                id="base"
                className="relative flex w-full items-center rounded-md rounded-b-none border border-th-input-border bg-th-input-bkg p-2 pl-9 font-mono text-sm font-bold text-th-fgd-1 focus:z-10 focus:border-th-fgd-4 focus:outline-none md:hover:z-10 md:hover:border-th-input-border-hover md:hover:focus:border-th-fgd-4 lg:text-base"
                placeholder="0.00"
                value={baseSize}
                onValueChange={handleBaseSizeChange}
              />
              <div className={`z-10 ${INPUT_PREFIX_CLASSNAMES}`}>
                <LogoWithFallback
                  alt=""
                  className="drop-shadow-md"
                  width={'24'}
                  height={'24'}
                  src={baseLogoURI || `/icons/${baseSymbol?.toLowerCase()}.svg`}
                  fallback={
                    <QuestionMarkCircleIcon
                      className={`h-5 w-5 text-th-fgd-3`}
                    />
                  }
                />
              </div>
              <div className={`z-10 ${INPUT_SUFFIX_CLASSNAMES}`}>
                {baseSymbol}
              </div>
            </div>
            <div className="relative">
              {quoteLogoURI ? (
                <div className={INPUT_PREFIX_CLASSNAMES}>
                  <Image alt="" width="20" height="20" src={quoteLogoURI} />
                </div>
              ) : (
                <div className={INPUT_PREFIX_CLASSNAMES}>
                  <QuestionMarkCircleIcon className="h-5 w-5 text-th-fgd-3" />
                </div>
              )}
              <NumberFormat
                inputMode="decimal"
                thousandSeparator=","
                allowNegative={false}
                isNumericString={true}
                decimalScale={
                  side === 'buy'
                    ? inputBank?.mintDecimals
                    : outputBank?.mintDecimals
                }
                name="quote"
                id="quote"
                className="mt-[-1px] flex w-full items-center rounded-md rounded-t-none border border-th-input-border bg-th-input-bkg p-2 pl-9 font-mono text-sm font-bold text-th-fgd-1 focus:border-th-fgd-4 focus:outline-none md:hover:border-th-input-border-hover md:hover:focus:border-th-fgd-4 lg:text-base"
                placeholder="0.00"
                value={quoteSize}
                onValueChange={handleQuoteSizeChange}
              />
              <div className={INPUT_SUFFIX_CLASSNAMES}>{quoteSymbol}</div>
            </div>
          </div>
          {swapFormSizeUi === 'slider' ? (
            <div className="mt-2">
              <SwapSlider
                useMargin={savedCheckboxSettings.margin}
                amount={
                  side === 'buy'
                    ? stringToNumberOrZero(quoteSize)
                    : stringToNumberOrZero(baseSize)
                }
                onChange={setAmountFromSlider}
                step={1 / 10 ** (inputBank?.mintDecimals || 6)}
                maxAmount={useTokenMax}
                handleStartDrag={handleSliderDrag}
                handleEndDrag={handleSliderDragEnd}
              />
            </div>
          ) : (
            <PercentageSelectButtons
              amountIn={side === 'buy' ? quoteSize : baseSize}
              setAmountIn={setAmountFromSlider}
              useMargin={savedCheckboxSettings.margin}
              values={['25', '50', '75', '100']}
            />
          )}
          <div className="mt-4">
            <Tooltip
              className="hidden md:block"
              delay={100}
              placement="left"
              content={t('trade:tooltip-enable-margin')}
            >
              <Checkbox
                checked={savedCheckboxSettings.margin}
                onChange={(e) =>
                  setSavedCheckboxSettings({
                    ...savedCheckboxSettings,
                    margin: e.target.checked,
                  })
                }
              >
                {t('trade:margin')}
              </Checkbox>
            </Tooltip>
          </div>
          <div className="mb-4 mt-6 flex">
            {ipAllowed ? (
              <Button
                className={`flex w-full items-center justify-center ${
                  !connected
                    ? ''
                    : side === 'buy'
                    ? 'bg-th-up-dark text-white md:hover:bg-th-up-dark md:hover:brightness-90'
                    : 'bg-th-down-dark text-white md:hover:bg-th-down-dark md:hover:brightness-90'
                }`}
                disabled={disabled}
                size="large"
                type="submit"
              >
                {loadingRoute ? (
                  <div className="flex items-center space-x-2">
                    <Loading />
                    <span className="hidden sm:block">
                      {t('common:fetching-route')}
                    </span>
                  </div>
                ) : !connected ? (
                  <div className="flex items-center">
                    <LinkIcon className="mr-2 h-5 w-5" />
                    {t('connect')}
                  </div>
                ) : tooMuchSize ? (
                  <span>
                    {t('swap:insufficient-balance', {
                      symbol: '',
                    })}
                  </span>
                ) : !placingOrder ? (
                  <span>
                    {t('trade:place-order', {
                      side: side === 'buy' ? t('buy') : t('sell'),
                    })}
                  </span>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Loading />
                    <span className="hidden sm:block">
                      {t('trade:placing-order')}
                    </span>
                  </div>
                )}
              </Button>
            ) : (
              <Button disabled className="w-full leading-tight" size="large">
                {t('country-not-allowed', {
                  country: ipCountry ? `(${ipCountry})` : '',
                })}
              </Button>
            )}
          </div>
          {quoteError ? (
            <div className="mb-4">
              <InlineNotification
                type="error"
                desc={t('trade:error-no-route')}
              />
            </div>
          ) : null}
          {!isInsured ? (
            <div className="mb-4">
              <UninsuredNotification name={outputBank?.name} />
            </div>
          ) : null}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <p>{t('trade:order-value')}</p>
              <p className="font-mono text-th-fgd-2">
                {orderValue ? (
                  <FormatNumericValue value={orderValue} isUsd />
                ) : (
                  '–'
                )}
              </p>
            </div>
            <HealthImpact maintProjectedHealth={maintProjectedHealth} small />
            <div className="flex justify-between text-xs">
              <Tooltip
                content={
                  <>
                    <p>
                      The price impact is the difference observed between the
                      total value of the entry tokens swapped and the
                      destination tokens obtained.
                    </p>
                    <p className="mt-1">
                      The bigger the trade is, the bigger the price impact can
                      be.
                    </p>
                  </>
                }
              >
                <p className="tooltip-underline">{t('swap:price-impact')}</p>
              </Tooltip>
              {loadingRoute ? (
                <SheenLoader>
                  <div className="h-3.5 w-12 bg-th-bkg-2" />
                </SheenLoader>
              ) : (
                <p className="text-right font-mono text-th-fgd-2">
                  {selectedRoute?.priceImpactPct
                    ? selectedRoute.priceImpactPct * 100 < 0.1
                      ? '<0.1%'
                      : `${(selectedRoute?.priceImpactPct * 100).toFixed(2)}%`
                    : '–'}
                </p>
              )}
            </div>
            {borrowAmount && inputBank && savedCheckboxSettings.margin ? (
              <>
                <div className="flex justify-between text-xs">
                  <Tooltip
                    content={
                      balance
                        ? t('trade:tooltip-borrow-balance', {
                            balance: formatNumericValue(balance),
                            borrowAmount: formatNumericValue(borrowAmount),
                            token: formatTokenSymbol(inputBank.name),
                            rate: formatNumericValue(
                              inputBank.getBorrowRateUi(),
                              2,
                            ),
                          })
                        : t('trade:tooltip-borrow-no-balance', {
                            borrowAmount: formatNumericValue(borrowAmount),
                            token: formatTokenSymbol(inputBank.name),
                            rate: formatNumericValue(
                              inputBank.getBorrowRateUi(),
                              2,
                            ),
                          })
                    }
                    delay={100}
                  >
                    <p className="tooltip-underline">{t('borrow-amount')}</p>
                  </Tooltip>
                  <p className="text-right font-mono text-th-fgd-2">
                    <FormatNumericValue
                      value={borrowAmount}
                      decimals={inputBank.mintDecimals}
                    />{' '}
                    <span className="font-body text-th-fgd-4">
                      {formatTokenSymbol(inputBank.name)}
                    </span>
                  </p>
                </div>
                <div className="flex justify-between text-xs">
                  <Tooltip
                    content={t('loan-origination-fee-tooltip', {
                      fee: `${(
                        inputBank.loanOriginationFeeRate.toNumber() * 100
                      ).toFixed(3)}%`,
                    })}
                    delay={100}
                  >
                    <p className="tooltip-underline">
                      {t('loan-origination-fee')}
                    </p>
                  </Tooltip>
                  <p className="text-right font-mono text-th-fgd-2">
                    <FormatNumericValue
                      value={
                        borrowAmount *
                        inputBank.loanOriginationFeeRate.toNumber()
                      }
                      decimals={inputBank.mintDecimals}
                    />{' '}
                    <span className="font-body text-th-fgd-4">
                      {formatTokenSymbol(inputBank.name)}
                    </span>
                  </p>
                </div>
              </>
            ) : null}
            <div className="flex items-center justify-between text-xs">
              <p className="pr-2 text-th-fgd-3">{t('common:route')}</p>
              {loadingRoute ? (
                <SheenLoader>
                  <div className="h-3.5 w-20 bg-th-bkg-2" />
                </SheenLoader>
              ) : !selectedRoute || selectedRoute?.error ? (
                <span className="text-th-fgd-2">–</span>
              ) : (
                <div className="flex items-center overflow-hidden text-th-fgd-2">
                  <Tooltip
                    content={selectedRoute?.routePlan?.map((info, index) => {
                      let includeSeparator = false
                      if (
                        selectedRoute?.routePlan &&
                        selectedRoute?.routePlan?.length > 1 &&
                        index !== selectedRoute?.routePlan?.length - 1
                      ) {
                        includeSeparator = true
                      }
                      return (
                        <span key={index}>{`${info?.swapInfo.label} ${
                          includeSeparator ? 'x ' : ''
                        }`}</span>
                      )
                    })}
                  >
                    <div className="tooltip-underline max-w-[140px] truncate whitespace-nowrap">
                      {selectedRoute?.routePlan?.map((info, index) => {
                        let includeSeparator = false
                        if (
                          selectedRoute?.routePlan &&
                          selectedRoute?.routePlan?.length > 1 &&
                          index !== selectedRoute?.routePlan?.length - 1
                        ) {
                          includeSeparator = true
                        }
                        return (
                          <span key={index}>{`${info?.swapInfo.label} ${
                            includeSeparator ? 'x ' : ''
                          }`}</span>
                        )
                      })}
                    </div>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
