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
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Loading from '@components/shared/Loading'
import Button from '@components/shared/Button'
import Image from 'next/image'
import useQuoteRoutes from '@components/swap/useQuoteRoutes'
import { HealthType, Serum3Market } from '@blockworks-foundation/mango-v4'
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
import MaxMarketSwapAmount from './MaxMarketSwapAmount'
import { floorToDecimal, formatNumericValue } from 'utils/numbers'
import { formatTokenSymbol } from 'utils/tokens'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { useTokenMax } from '@components/swap/useTokenMax'
import SheenLoader from '@components/shared/SheenLoader'
import { fetchJupiterTransaction } from '@components/swap/SwapReviewRouteInfo'
import {
  AddressLookupTableAccount,
  TransactionInstruction,
} from '@solana/web3.js'

const set = mangoStore.getState().set
const slippage = 100

function stringToNumberOrZero(s: string): number {
  const n = parseFloat(s)
  if (isNaN(n)) {
    return 0
  }
  return n
}

type PreloadedTransaction = {
  data: [TransactionInstruction[], AddressLookupTableAccount[]]
  timestamp: number
}

export default function SpotMarketOrderSwapForm() {
  const { t } = useTranslation()
  const { baseSize, quoteSize, side } = mangoStore((s) => s.tradeForm)
  const { isUnownedAccount } = useUnownedAccount()
  const [placingOrder, setPlacingOrder] = useState(false)
  const { ipAllowed, ipCountry } = useIpAddress()
  const { connected, publicKey, connect } = useWallet()
  const [swapFormSizeUi] = useLocalStorageState(SIZE_INPUT_UI_KEY, 'slider')
  const [savedCheckboxSettings, setSavedCheckboxSettings] =
    useLocalStorageState(TRADE_CHECKBOXES_KEY, DEFAULT_CHECKBOX_SETTINGS)
  const [swapTx, setSwapTx] = useState<PreloadedTransaction>()
  const {
    selectedMarket,
    price: oraclePrice,
    baseLogoURI,
    baseSymbol,
    quoteLogoURI,
    quoteSymbol,
    serumOrPerpMarket,
  } = useSelectedMarket()
  const { amount: tokenMax, amountWithBorrow } = useTokenMax(
    savedCheckboxSettings.margin,
  )

  const handleBaseSizeChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      set((s) => {
        const price =
          s.tradeForm.tradeType === 'Market'
            ? oraclePrice
            : Number(s.tradeForm.price)

        s.tradeForm.baseSize = e.value
        if (price && e.value !== '' && !Number.isNaN(Number(e.value))) {
          s.tradeForm.quoteSize = new Decimal(price).mul(e.value).toFixed()
        } else {
          s.tradeForm.quoteSize = ''
        }
      })
    },
    [oraclePrice],
  )

  const handleQuoteSizeChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      set((s) => {
        const price =
          s.tradeForm.tradeType === 'Market'
            ? oraclePrice
            : Number(s.tradeForm.price)

        s.tradeForm.quoteSize = e.value
        if (price && e.value !== '' && !Number.isNaN(Number(e.value))) {
          s.tradeForm.baseSize = new Decimal(e.value).div(price).toFixed()
        } else {
          s.tradeForm.baseSize = ''
        }
      })
    },
    [oraclePrice],
  )

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

  const { bestRoute: selectedRoute, isLoading } = useQuoteRoutes({
    inputMint: inputBank?.mint.toString() || '',
    outputMint: outputBank?.mint.toString() || '',
    amount: side === 'buy' ? quoteSize : baseSize,
    slippage,
    swapMode: 'ExactIn',
    wallet: publicKey?.toBase58(),
    mode: 'JUPITER',
  })

  const fetchTransaction = useCallback(async () => {
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const connection = mangoStore.getState().connection

    if (!group || !mangoAccount) return

    if (
      !mangoAccount ||
      !group ||
      !inputBank ||
      !outputBank ||
      !publicKey ||
      !selectedRoute
    )
      return

    const [ixs, alts] = await fetchJupiterTransaction(
      connection,
      selectedRoute,
      publicKey,
      slippage,
      inputBank.mint,
      outputBank.mint,
    )

    setSwapTx({ data: [ixs, alts], timestamp: Date.now() })

    return [ixs, alts]
  }, [selectedRoute, inputBank, outputBank, publicKey])

  useEffect(() => {
    if (selectedRoute) fetchTransaction()
  }, [selectedRoute, fetchTransaction])

  const handlePlaceOrder = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const { baseSize, quoteSize, side } = mangoStore.getState().tradeForm
    const actions = mangoStore.getState().actions

    if (
      !mangoAccount ||
      !group ||
      !inputBank ||
      !outputBank ||
      !publicKey ||
      !selectedRoute ||
      !swapTx
    )
      return

    setPlacingOrder(true)

    try {
      const [ixs, alts] = swapTx.data
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
        notify({
          title: 'Transaction failed',
          description: e.message,
          txid: e?.txid,
          type: 'error',
        })
      }
    } finally {
      setPlacingOrder(false)
    }
  }, [inputBank, outputBank, publicKey, selectedRoute, swapTx])

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

  const disabled =
    (connected && (!baseSize || !oraclePrice)) ||
    !serumOrPerpMarket ||
    isLoading ||
    tooMuchSize

  return (
    <>
      <form onSubmit={(e) => handleSubmit(e)}>
        <div className="mt-3 px-3 md:px-4">
          {!isUnownedAccount ? (
            <MaxMarketSwapAmount
              useMargin={savedCheckboxSettings.margin}
              setAmountIn={setAmountFromSlider}
            />
          ) : null}
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
                className="-mt-[1px] flex w-full items-center rounded-md rounded-t-none border border-th-input-border bg-th-input-bkg p-2 pl-9 font-mono text-sm font-bold text-th-fgd-1 focus:border-th-fgd-4 focus:outline-none md:hover:border-th-input-border-hover md:hover:focus:border-th-fgd-4 lg:text-base"
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
          <div className="mb-4 mt-6 flex" onMouseEnter={fetchTransaction}>
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
                {isLoading ? (
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
              {isLoading ? (
                <SheenLoader>
                  <div className="h-3.5 w-12 bg-th-bkg-2" />
                </SheenLoader>
              ) : (
                <p className="text-right font-mono text-th-fgd-2">
                  {selectedRoute
                    ? selectedRoute?.priceImpactPct * 100 < 0.1
                      ? '<0.1%'
                      : `${(selectedRoute?.priceImpactPct * 100).toFixed(2)}%`
                    : '-'}
                </p>
              )}
            </div>
            {borrowAmount && inputBank ? (
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
              {isLoading ? (
                <SheenLoader>
                  <div className="h-3.5 w-20 bg-th-bkg-2" />
                </SheenLoader>
              ) : (
                <div className="flex items-center overflow-hidden text-th-fgd-2">
                  <Tooltip
                    content={selectedRoute?.marketInfos.map((info, index) => {
                      let includeSeparator = false
                      if (
                        selectedRoute?.marketInfos.length > 1 &&
                        index !== selectedRoute?.marketInfos.length - 1
                      ) {
                        includeSeparator = true
                      }
                      return (
                        <span key={index}>{`${info?.label} ${
                          includeSeparator ? 'x ' : ''
                        }`}</span>
                      )
                    })}
                  >
                    <div className="tooltip-underline max-w-[140px] truncate whitespace-nowrap">
                      {selectedRoute?.marketInfos.map((info, index) => {
                        let includeSeparator = false
                        if (
                          selectedRoute?.marketInfos.length > 1 &&
                          index !== selectedRoute?.marketInfos.length - 1
                        ) {
                          includeSeparator = true
                        }
                        return (
                          <span key={index}>{`${info?.label} ${
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
