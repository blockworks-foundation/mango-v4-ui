import {
  HealthType,
  OracleProvider,
  PerpMarket,
  PerpOrderSide,
  PerpOrderType,
  Serum3Market,
  Serum3OrderType,
  Serum3SelfTradeBehavior,
  Serum3Side,
} from '@blockworks-foundation/mango-v4'
import Checkbox from '@components/forms/Checkbox'
import Tooltip from '@components/shared/Tooltip'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import NumberFormat, {
  NumberFormatValues,
  SourceInfo,
} from 'react-number-format'
import * as sentry from '@sentry/nextjs'

import { notify } from 'utils/notifications'
import SpotSlider, { useSpotMarketMax } from './SpotSlider'
import {
  OrderTypes,
  TriggerOrderTypes,
  calculateLimitPriceForMarketOrder,
  handlePlaceTriggerOrder,
} from 'utils/tradeForm'
import Image from 'next/legacy/image'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import TabUnderline from '@components/shared/TabUnderline'
import PerpSlider, { usePerpMarketMax } from './PerpSlider'
import useLocalStorageState from 'hooks/useLocalStorageState'
import {
  MAX_PERP_SLIPPAGE,
  SIZE_INPUT_UI_KEY,
  SOUND_SETTINGS_KEY,
  TRADE_CHECKBOXES_KEY,
} from 'utils/constants'
import SpotButtonGroup from './SpotButtonGroup'
import PerpButtonGroup from './PerpButtonGroup'
import SolBalanceWarnings from '@components/shared/SolBalanceWarnings'
import useSelectedMarket from 'hooks/useSelectedMarket'
import {
  floorToDecimal,
  formatCurrencyValue,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import LogoWithFallback from '@components/shared/LogoWithFallback'
import ButtonGroup from '@components/forms/ButtonGroup'
import TradeSummary from './TradeSummary'
import useMangoAccount from 'hooks/useMangoAccount'
import MaxSizeButton from './MaxSizeButton'
import { INITIAL_SOUND_SETTINGS } from '@components/settings/SoundSettings'
import { Howl } from 'howler'
import { OrderbookL2, isMangoError } from 'types'
import InlineNotification from '@components/shared/InlineNotification'
import SpotMarketOrderSwapForm from './SpotMarketOrderSwapForm'
import useRemainingBorrowsInPeriod from 'hooks/useRemainingBorrowsInPeriod'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Select from '@components/forms/Select'
import TriggerOrderMaxButton from './TriggerOrderMaxButton'
import TradePriceDifference from '@components/shared/TradePriceDifference'
import { getTokenBalance } from '@components/swap/TriggerSwapForm'
import useMangoAccountAccounts from 'hooks/useMangoAccountAccounts'
import useTokenPositionsFull from 'hooks/useAccountPositionsFull'
import AccountSlotsFullNotification from '@components/shared/AccountSlotsFullNotification'
import DepositWithdrawModal from '@components/modals/DepositWithdrawModal'
import CreateAccountModal from '@components/modals/CreateAccountModal'
import TradeformSubmitButton from './TradeformSubmitButton'
import useIpAddress from 'hooks/useIpAddress'
import useOpenPerpPositions from 'hooks/useOpenPerpPositions'
import { isTokenInsured } from '@components/DepositForm'
import UninsuredNotification from '@components/shared/UninsuredNotification'

dayjs.extend(relativeTime)

const set = mangoStore.getState().set

export const successSound = new Howl({
  src: ['/sounds/swap-success.mp3'],
  volume: 0.5,
})

export const INPUT_SUFFIX_CLASSNAMES =
  'absolute right-[1px] top-1/2 flex h-[calc(100%-2px)] -translate-y-1/2 items-center rounded-r-md bg-th-input-bkg px-2 text-xs font-normal text-th-fgd-4'

export const INPUT_PREFIX_CLASSNAMES =
  'absolute left-2 top-1/2 h-5 w-5 shrink-0 -translate-y-1/2'

export const DEFAULT_CHECKBOX_SETTINGS = {
  ioc: false,
  post: false,
  margin: true,
}

type TradeForm = {
  baseSize: number
  orderType: OrderTypes | TriggerOrderTypes
  price: string | undefined
  side: 'buy' | 'sell'
}

type FormErrors = Partial<Record<keyof TradeForm, string>>

const AdvancedTradeForm = () => {
  const { t } = useTranslation([
    'common',
    'account',
    'settings',
    'swap',
    'trade',
  ])
  const { poolIsPerpReadyForRefresh } = useOpenPerpPositions()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const { usedSerum3, totalSerum3, usedPerps, totalPerps } =
    useMangoAccountAccounts()
  const tradeForm = mangoStore((s) => s.tradeForm)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const [tradeFormSizeUi] = useLocalStorageState(SIZE_INPUT_UI_KEY, 'slider')
  const [savedCheckboxSettings, setSavedCheckboxSettings] =
    useLocalStorageState(TRADE_CHECKBOXES_KEY, DEFAULT_CHECKBOX_SETTINGS)
  const { ipAllowed, perpAllowed, spotAllowed, ipCountry } = useIpAddress()
  const [soundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS,
  )
  const {
    selectedMarket,
    price: oraclePrice,
    baseLogoURI,
    baseSymbol,
    quoteBank,
    quoteLogoURI,
    quoteSymbol,
    serumOrPerpMarket,
    marketAddress,
  } = useSelectedMarket()
  const { remainingBorrowsInPeriod, timeToNextPeriod } =
    useRemainingBorrowsInPeriod()
  const { max: spotMax } = useSpotMarketMax(
    mangoAccount,
    selectedMarket,
    tradeForm.side,
    savedCheckboxSettings.margin,
  )

  const perpMax = usePerpMarketMax(mangoAccount, selectedMarket, tradeForm.side)

  const baseBank = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket || selectedMarket instanceof PerpMarket)
      return
    const bank = group.getFirstBankByTokenIndex(selectedMarket.baseTokenIndex)
    return bank
  }, [selectedMarket])

  const isInsured = useMemo(() => {
    if (selectedMarket instanceof Serum3Market) {
      const group = mangoStore.getState().group
      return isTokenInsured(baseBank, group)
    } else {
      return selectedMarket ? selectedMarket.groupInsuranceFund : true
    }
  }, [baseBank, selectedMarket])

  // check for available account token slots
  const tokenPositionsFull = useTokenPositionsFull([baseBank, quoteBank])

  // check for available serum account slots if serum market
  const serumSlotsFull = useMemo(() => {
    if (!selectedMarket || selectedMarket instanceof PerpMarket) return false
    const hasSlot = usedSerum3.find(
      (market) => market.marketIndex === selectedMarket.marketIndex,
    )
    return usedSerum3.length >= totalSerum3.length && !hasSlot
  }, [usedSerum3, totalSerum3, selectedMarket])

  // check for available perp account slots if perp market
  const perpSlotsFull = useMemo(() => {
    if (!selectedMarket || selectedMarket instanceof Serum3Market) return false
    const hasSlot = usedPerps.find(
      (market) => market.marketIndex === selectedMarket.perpMarketIndex,
    )
    return usedPerps.length >= totalPerps.length && !hasSlot
  }, [usedPerps, totalPerps, selectedMarket])

  const setTradeType = useCallback(
    (tradeType: OrderTypes | TriggerOrderTypes) => {
      set((s) => {
        s.tradeForm.tradeType = tradeType
      })
    },
    [],
  )

  const handlePriceChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      set((s) => {
        s.tradeForm.price = e.value
        if (s.tradeForm.baseSize && !Number.isNaN(Number(e.value))) {
          s.tradeForm.quoteSize = (
            (parseFloat(e.value) || 0) * parseFloat(s.tradeForm.baseSize)
          ).toString()
        }
      })
      setFormErrors({})
    },
    [],
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

  const handlePostOnlyChange = useCallback(
    (postOnly: boolean) => {
      let ioc = tradeForm.ioc
      if (postOnly) {
        ioc = !postOnly
      }
      set((s) => {
        s.tradeForm.postOnly = postOnly
        s.tradeForm.ioc = ioc
      })
      setSavedCheckboxSettings({
        ...savedCheckboxSettings,
        ioc: ioc,
        post: postOnly,
      })
    },
    [savedCheckboxSettings],
  )

  const handleIocChange = useCallback(
    (ioc: boolean) => {
      let postOnly = tradeForm.postOnly
      if (ioc) {
        postOnly = !ioc
      }
      set((s) => {
        s.tradeForm.ioc = ioc
        s.tradeForm.postOnly = postOnly
      })
      setSavedCheckboxSettings({
        ...savedCheckboxSettings,
        ioc: ioc,
        post: postOnly,
      })
    },
    [savedCheckboxSettings],
  )

  useEffect(() => {
    const { ioc, post } = savedCheckboxSettings
    set((s) => {
      s.tradeForm.ioc = ioc
      s.tradeForm.postOnly = post
    })
  }, [])

  const handleReduceOnlyChange = useCallback((reduceOnly: boolean) => {
    set((s) => {
      s.tradeForm.reduceOnly = reduceOnly
    })
  }, [])

  const handleSetSide = useCallback((side: 'buy' | 'sell') => {
    set((s) => {
      s.tradeForm.side = side
    })
    setFormErrors({})
  }, [])

  const handleSetMargin = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSavedCheckboxSettings({
        ...savedCheckboxSettings,
        margin: e.target.checked,
      })

      const { group } = mangoStore.getState()
      const { tradeType, side, price, baseSize, quoteSize } = tradeForm
      const tradePrice = tradeType === 'Market' ? oraclePrice : price

      if (
        !group ||
        !mangoAccount ||
        !baseBank ||
        !quoteBank ||
        !tradePrice ||
        !(selectedMarket instanceof Serum3Market)
      ) {
        return
      }

      const isBuySide = side === 'buy'
      const balanceBank = isBuySide ? quoteBank : baseBank
      const balance = mangoAccount.getTokenBalanceUi(balanceBank)
      const max = Math.max(balance, 0)

      const sizeToCompare = isBuySide ? quoteSize : baseSize
      const isSizeTooLarge = parseFloat(sizeToCompare) > max

      set((s) => {
        if (max <= 0) {
          s.tradeForm.baseSize = ''
          s.tradeForm.quoteSize = ''
          return
        }
        if (isSizeTooLarge) {
          if (isBuySide) {
            s.tradeForm.quoteSize = floorToDecimal(max, tickDecimals).toFixed()
            s.tradeForm.baseSize = floorToDecimal(
              max / Number(tradePrice),
              minOrderDecimals,
            ).toFixed()
          } else {
            s.tradeForm.baseSize = floorToDecimal(
              max,
              minOrderDecimals,
            ).toFixed()
            s.tradeForm.quoteSize = floorToDecimal(
              max * Number(tradePrice),
              tickDecimals,
            ).toFixed()
          }
        }
      })
    },
    [
      baseBank,
      quoteBank,
      mangoAccount,
      oraclePrice,
      savedCheckboxSettings,
      selectedMarket,
      set,
      tradeForm,
    ],
  )

  const tickDecimals = useMemo(() => {
    if (!serumOrPerpMarket) return 1
    const tickSize = serumOrPerpMarket.tickSize
    const tickDecimals = getDecimalCount(tickSize)
    return tickDecimals
  }, [serumOrPerpMarket])

  const [minOrderDecimals, minOrderSize] = useMemo(() => {
    if (!serumOrPerpMarket) return [1, 0.1]
    const minOrderSize = serumOrPerpMarket.minOrderSize
    const minOrderDecimals = getDecimalCount(minOrderSize)
    return [minOrderDecimals, minOrderSize]
  }, [serumOrPerpMarket])

  const isMarketEnabled = useMemo(() => {
    const { group } = mangoStore.getState()
    if (!selectedMarket || !group) return false
    if (selectedMarket instanceof PerpMarket) {
      return selectedMarket.oracleLastUpdatedSlot !== 0
    } else if (selectedMarket instanceof Serum3Market) {
      return (
        baseBank?.oracleProvider == OracleProvider.Stub ||
        (baseBank?.oracleLastUpdatedSlot !== 0 &&
          (quoteBank?.name == 'USDC'
            ? true
            : quoteBank?.oracleLastUpdatedSlot !== 0))
      )
    }
  }, [baseBank, quoteBank, selectedMarket])

  // clear form errors on base size change or new market
  useEffect(() => {
    if (Object.keys(formErrors).length) {
      setFormErrors({})
    }
  }, [tradeForm.baseSize, marketAddress])

  const isSanctioned = useMemo(() => {
    return !(
      ipAllowed ||
      (selectedMarket instanceof PerpMarket && perpAllowed) ||
      (selectedMarket instanceof Serum3Market && spotAllowed)
    )
  }, [selectedMarket, ipAllowed, perpAllowed, spotAllowed])

  const hasPosition = useMemo(() => {
    const group = mangoStore.getState().group
    if (!mangoAccount || !selectedMarket || !group) return false
    if (selectedMarket instanceof PerpMarket) {
      const basePosition = mangoAccount
        .getPerpPosition(selectedMarket.perpMarketIndex)
        ?.getBasePositionUi(selectedMarket)
      return basePosition !== undefined && basePosition !== 0
    } else if (selectedMarket instanceof Serum3Market) {
      const baseBank = group.getFirstBankByTokenIndex(
        selectedMarket.baseTokenIndex,
      )
      const tokenPosition = mangoAccount.getTokenBalanceUi(baseBank)
      return tradeForm.side === 'sell' && tokenPosition !== 0
    }
  }, [selectedMarket, ipCountry, mangoAccount, tradeForm])

  const isForceReduceOnly = useMemo(() => {
    if (!selectedMarket) return false
    return selectedMarket.reduceOnly || !!(isSanctioned && hasPosition)
  }, [selectedMarket, isSanctioned, hasPosition])

  useEffect(() => {
    if (isSanctioned) {
      set((state) => {
        state.tradeForm.reduceOnly = true
      })
      setSavedCheckboxSettings({
        ...savedCheckboxSettings,
        margin: false,
      })
    }
  }, [isSanctioned])

  /*
   * Updates the limit price on page load
   */
  useEffect(() => {
    if (tradeForm.price === undefined) {
      const group = mangoStore.getState().group
      if (!group || !oraclePrice) return

      set((s) => {
        s.tradeForm.price = oraclePrice.toFixed(tickDecimals)
      })
    }
  }, [oraclePrice, tickDecimals, tradeForm.price])

  /*
   * Updates the price and the quote size when a Market order is selected
   */
  useEffect(() => {
    const group = mangoStore.getState().group
    if (
      tradeForm.tradeType === 'Market' &&
      oraclePrice &&
      selectedMarket &&
      group
    ) {
      if (!isNaN(parseFloat(tradeForm.baseSize))) {
        const baseSize = new Decimal(tradeForm.baseSize)?.toNumber()
        const quoteSize = baseSize * oraclePrice
        set((s) => {
          s.tradeForm.price = oraclePrice.toFixed(tickDecimals)
          s.tradeForm.quoteSize = quoteSize.toFixed(tickDecimals)
        })
      } else {
        set((s) => {
          s.tradeForm.price = oraclePrice.toFixed(tickDecimals)
        })
      }
    }
  }, [oraclePrice, selectedMarket, tickDecimals, tradeForm])

  const isTriggerOrder = useMemo(() => {
    return (
      tradeForm.tradeType === TriggerOrderTypes.STOP_LOSS ||
      tradeForm.tradeType === TriggerOrderTypes.TAKE_PROFIT
    )
  }, [tradeForm.tradeType])

  // default to correct side for trigger orders
  useEffect(() => {
    if (isTriggerOrder) {
      const balance = getTokenBalance(baseBank)
      set((state) => {
        if (balance > 0) {
          state.tradeForm.side = 'sell'
        } else {
          state.tradeForm.side = 'buy'
        }
      })
    }
  }, [isTriggerOrder])

  // // set default trigger price
  useEffect(() => {
    if (isTriggerOrder) {
      let triggerPrice = oraclePrice
      if (tradeForm.tradeType === TriggerOrderTypes.STOP_LOSS) {
        if (tradeForm.side === 'buy') {
          triggerPrice = oraclePrice * 1.1
        } else {
          triggerPrice = oraclePrice * 0.9
        }
      } else {
        if (tradeForm.side === 'buy') {
          triggerPrice = oraclePrice * 0.9
        } else {
          triggerPrice = oraclePrice * 1.1
        }
      }
      set((state) => {
        state.tradeForm.price = floorToDecimal(
          triggerPrice,
          tickDecimals,
        ).toFixed()
      })
    }
  }, [isTriggerOrder, tickDecimals, tradeForm.side, tradeForm.tradeType])

  const isFormValid = useCallback(
    (form: TradeForm) => {
      const { baseSize, price, orderType, side } = form
      const invalidFields: FormErrors = {}
      setFormErrors({})
      const requiredFields: (keyof TradeForm)[] = ['baseSize', 'price']
      const priceNumber = price ? parseFloat(price) : 0
      const baseTokenBalance = getTokenBalance(baseBank)
      const isReducingShort = baseTokenBalance < 0
      for (const key of requiredFields) {
        const value = form[key] as string
        if (!value) {
          invalidFields[key] = t('settings:error-required-field')
        }
      }
      if (orderType === TriggerOrderTypes.STOP_LOSS) {
        if (isReducingShort && priceNumber <= oraclePrice) {
          invalidFields.price = t('trade:error-trigger-above')
        }
        if (!isReducingShort && priceNumber >= oraclePrice) {
          invalidFields.price = t('trade:error-trigger-below')
        }
      }
      if (orderType === TriggerOrderTypes.TAKE_PROFIT) {
        if (isReducingShort && priceNumber >= oraclePrice) {
          invalidFields.price = t('trade:error-trigger-below')
        }
        if (!isReducingShort && priceNumber <= oraclePrice) {
          invalidFields.price = t('trade:error-trigger-above')
        }
      }
      if (side === 'buy' && !isReducingShort && isTriggerOrder) {
        invalidFields.baseSize = t('trade:error-no-short')
      }
      if (side === 'sell' && isReducingShort && isTriggerOrder) {
        invalidFields.baseSize = t('trade:error-no-long')
      }
      if (baseSize > Math.abs(baseTokenBalance) && isTriggerOrder) {
        invalidFields.baseSize = t('swap:insufficient-balance', {
          symbol: baseBank?.name,
        })
      }

      if (baseSize < minOrderSize) {
        invalidFields.baseSize = t('trade:min-order-size-error', {
          minSize: formatNumericValue(minOrderSize, minOrderDecimals),
          symbol: baseSymbol,
        })
      }
      if (selectedMarket instanceof Serum3Market && price) {
        const numberPrice = parseFloat(price)
        const priceBand = selectedMarket.oraclePriceBand
        if (side === 'buy') {
          const priceLimit = (oraclePrice / (100 * (0.98 + priceBand))) * 100
          if (numberPrice < priceLimit) {
            invalidFields.price = t(
              'trade:error-limit-price-buy-outside-band',
              {
                limit: priceLimit.toFixed(tickDecimals),
              },
            )
          }
        } else {
          const priceLimit = (oraclePrice / (100 / (0.98 + priceBand))) * 100
          if (numberPrice > priceLimit) {
            invalidFields.price = t(
              'trade:error-limit-price-sell-outside-band',
              {
                limit: priceLimit.toFixed(tickDecimals),
              },
            )
          }
        }
      }
      if (Object.keys(invalidFields).length) {
        setFormErrors(invalidFields)
      }
      return invalidFields
    },
    [
      baseBank,
      isTriggerOrder,
      minOrderDecimals,
      minOrderSize,
      oraclePrice,
      selectedMarket,
      setFormErrors,
      baseSymbol,
      t,
      tickDecimals,
    ],
  )
  const calcOrderPrice = useCallback(
    (price: number, orderbook: OrderbookL2) => {
      let orderPrice = price
      if (tradeForm.tradeType === 'Market') {
        try {
          if (tradeForm.side === 'sell') {
            const marketPrice = Math.max(
              oraclePrice,
              orderbook?.bids?.[0]?.[0] || 0,
            )
            orderPrice = marketPrice * (1 - MAX_PERP_SLIPPAGE)
          } else {
            const marketPrice = Math.min(
              oraclePrice,
              orderbook?.asks?.[0]?.[0] || Infinity,
            )
            orderPrice = marketPrice * (1 + MAX_PERP_SLIPPAGE)
          }
        } catch (e) {
          //simple fallback if something go wrong
          const maxSlippage = 0.025
          orderPrice =
            price *
            (tradeForm.side === 'buy' ? 1 + maxSlippage : 1 - maxSlippage)
        }
        notify({
          type: 'info',
          title: t('trade:max-slippage-price-notification', {
            price: `$${orderPrice.toFixed(tickDecimals)}`,
          }),
        })
      }
      return orderPrice
    },
    [oraclePrice, t, tickDecimals, tradeForm.side, tradeForm.tradeType],
  )

  const handleStandardOrder = useCallback(async () => {
    const { client } = mangoStore.getState()
    const { group } = mangoStore.getState()
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const { tradeForm } = mangoStore.getState()
    const { actions } = mangoStore.getState()
    const selectedMarket = mangoStore.getState().selectedMarket.current
    const orderbook = mangoStore.getState().selectedMarket.orderbook

    if (!group || !mangoAccount) return
    setPlacingOrder(true)
    try {
      const baseSize = Number(tradeForm.baseSize)
      let price = Number(tradeForm.price)
      if (tradeForm.tradeType === 'Market') {
        price = calculateLimitPriceForMarketOrder(
          orderbook,
          baseSize,
          tradeForm.side,
        )
      }
      const invalidFields = isFormValid({
        baseSize: baseSize,
        price: tradeForm.price,
        orderType: tradeForm.tradeType,
        side: tradeForm.side,
      })
      if (Object.keys(invalidFields).length) {
        return
      }
      if (selectedMarket instanceof Serum3Market) {
        const spotOrderType = tradeForm.ioc
          ? Serum3OrderType.immediateOrCancel
          : tradeForm.postOnly && tradeForm.tradeType !== 'Market'
          ? Serum3OrderType.postOnly
          : Serum3OrderType.limit
        const { signature: tx } = await client.serum3PlaceOrder(
          group,
          mangoAccount,
          selectedMarket.serumMarketExternal,
          tradeForm.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
          price,
          baseSize,
          Serum3SelfTradeBehavior.decrementTake,
          spotOrderType,
          Date.now(),
          10,
        )
        actions.fetchOpenOrders(true)
        set((s) => {
          s.successAnimation.trade = true
        })
        if (soundSettings['swap-success']) {
          successSound.play()
        }
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx,
        })
      } else if (selectedMarket instanceof PerpMarket) {
        const perpOrderType =
          tradeForm.tradeType === 'Market' || tradeForm.ioc
            ? PerpOrderType.immediateOrCancel
            : tradeForm.postOnly
            ? PerpOrderType.postOnly
            : PerpOrderType.limit

        const orderPrice = calcOrderPrice(price, orderbook)

        const { signature: tx } = await client.perpPlaceOrder(
          group,
          mangoAccount,
          selectedMarket.perpMarketIndex,
          tradeForm.side === 'buy' ? PerpOrderSide.bid : PerpOrderSide.ask,
          orderPrice,
          Math.abs(baseSize),
          undefined, // maxQuoteQuantity
          Date.now(),
          perpOrderType,
          selectedMarket.reduceOnly || tradeForm.reduceOnly,
          undefined,
          undefined,
        )
        await poolIsPerpReadyForRefresh(
          () => {
            actions.fetchOpenOrders(true)
          },
          () => {
            notify({
              type: 'error',
              title:
                'Timeout during perp refresh, please refresh data manually',
            })
          },
        )
        set((s) => {
          s.successAnimation.trade = true
        })
        if (soundSettings['swap-success']) {
          successSound.play()
        }
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx,
        })
      }
    } catch (e) {
      console.error('Place trade error:', e)
      sentry.captureException(e)
      if (!isMangoError(e)) return
      notify({
        title: 'There was an issue.',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
    } finally {
      setPlacingOrder(false)
    }
  }, [isFormValid, oraclePrice, soundSettings, tickDecimals])

  const handleTriggerOrder = useCallback(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const { baseSize, price, side, tradeType } = mangoStore.getState().tradeForm
    const invalidFields = isFormValid({
      baseSize: parseFloat(baseSize),
      price: price,
      orderType: tradeType,
      side,
    })
    if (Object.keys(invalidFields).length) {
      return
    }
    if (!mangoAccount || !baseBank || !price) return
    const isReducingShort = mangoAccount.getTokenBalanceUi(baseBank) < 0
    const orderType = tradeType as TriggerOrderTypes
    handlePlaceTriggerOrder(
      baseBank,
      quoteBank,
      Number(baseSize),
      price,
      orderType,
      isReducingShort,
      false,
      setPlacingOrder,
    )
  }, [baseBank, quoteBank, setPlacingOrder, isFormValid])

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      isTriggerOrder ? handleTriggerOrder() : handleStandardOrder()
    },
    [isTriggerOrder, handleTriggerOrder, handleStandardOrder],
  )

  const sideNames = useMemo(() => {
    return selectedMarket instanceof PerpMarket
      ? [t('trade:long'), t('trade:short')]
      : [t('buy'), t('sell')]
  }, [selectedMarket, t])

  const balanceBank = useMemo(() => {
    if (
      !selectedMarket ||
      selectedMarket instanceof PerpMarket ||
      !savedCheckboxSettings.margin ||
      isTriggerOrder
    )
      return
    if (tradeForm.side === 'buy') {
      return quoteBank
    } else {
      return baseBank
    }
  }, [
    baseBank,
    quoteBank,
    savedCheckboxSettings,
    selectedMarket,
    tradeForm.side,
    isTriggerOrder,
  ])

  // check if the borrowed amount exceeds the net borrow limit in the current period
  const borrowExceedsLimitInPeriod = useMemo(() => {
    if (!mangoAccount || !balanceBank || !remainingBorrowsInPeriod) return false
    const size =
      tradeForm.side === 'buy' ? tradeForm.quoteSize : tradeForm.baseSize
    const balance = mangoAccount.getTokenDepositsUi(balanceBank)
    const remainingBalance = balance - parseFloat(size)
    const borrowAmount = remainingBalance < 0 ? Math.abs(remainingBalance) : 0
    const borrowAmountNotional = borrowAmount * balanceBank.uiPrice
    return borrowAmountNotional > remainingBorrowsInPeriod
  }, [balanceBank, mangoAccount, remainingBorrowsInPeriod, tradeForm])

  const orderTypes = useMemo(() => {
    const orderTypesArray = Object.values(OrderTypes)
    if (
      !selectedMarket ||
      selectedMarket instanceof PerpMarket ||
      !mangoAccountAddress
    )
      return orderTypesArray
    const baseBalance = floorToDecimal(
      getTokenBalance(baseBank),
      minOrderDecimals,
    ).toNumber()
    const triggerOrderTypesArray = Object.values(TriggerOrderTypes)
    return Math.abs(baseBalance) > 0
      ? [...orderTypesArray, ...triggerOrderTypesArray]
      : orderTypesArray
  }, [baseBank, mangoAccountAddress, minOrderDecimals, selectedMarket])

  const initHealth = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !mangoAccount) return 100
    return mangoAccount.getHealthRatioUi(group, HealthType.init)
  }, [mangoAccount])

  const tooMuchSize = useMemo(() => {
    const { baseSize, quoteSize, side, tradeType } = tradeForm
    if (!baseSize || !quoteSize) return false

    // when init health <= 0 users may not be able to close positions via limit orders. we don't want to disable the place order button in this scenario. however we still ues this const to disable the button to restrict users from entering unwanted margin positions.
    if (initHealth <= 0 && tradeType === 'Limit' && mangoAccount) {
      if (selectedMarket instanceof Serum3Market && baseBank && quoteBank) {
        const balance =
          side === 'buy'
            ? mangoAccount?.getTokenBalanceUi(quoteBank)
            : mangoAccount?.getTokenBalanceUi(baseBank)
        if (balance) return false
      }
      if (selectedMarket instanceof PerpMarket) {
        const basePosition = mangoAccount
          .getPerpPosition(selectedMarket.perpMarketIndex)
          ?.getBasePositionUi(selectedMarket)
        if (basePosition !== 0 && basePosition !== undefined) {
          if (basePosition > 0 && side === 'sell') {
            return false
          }
          if (basePosition < 0 && side === 'buy') {
            return false
          }
        }
      }
    }

    // check the values in the trade form are not greater than the allowed account max
    const size = side === 'buy' ? new Decimal(quoteSize) : new Decimal(baseSize)
    const decimalMax =
      selectedMarket instanceof Serum3Market
        ? new Decimal(spotMax)
        : new Decimal(perpMax)
    return size.gt(decimalMax)
  }, [
    baseBank,
    initHealth,
    mangoAccount,
    perpMax,
    quoteBank,
    selectedMarket,
    spotMax,
    tradeForm,
  ])

  const disabled =
    !serumOrPerpMarket ||
    !isMarketEnabled ||
    !mangoAccountAddress ||
    !parseFloat(tradeForm.baseSize)

  return (
    <div>
      <div className="mt-1.5 px-2 md:mt-0 md:px-4 md:pt-5 lg:mt-5 lg:pt-0">
        <TabUnderline
          activeValue={tradeForm.side}
          values={['buy', 'sell']}
          names={sideNames}
          onChange={(v) => handleSetSide(v as 'buy' | 'sell')}
          small
        />
      </div>
      <div className="px-3 md:px-4">
        <SolBalanceWarnings className="mt-4" />
      </div>
      <div className="mt-1 px-2 md:mt-3 md:px-4">
        <p className="mb-2 text-xs">{t('trade:order-type')}</p>
        {selectedMarket instanceof PerpMarket ? (
          <ButtonGroup
            activeValue={tradeForm.tradeType}
            onChange={(tab: OrderTypes | TriggerOrderTypes) =>
              setTradeType(tab)
            }
            values={orderTypes}
          />
        ) : (
          <Select
            value={t(tradeForm.tradeType)}
            onChange={(type: OrderTypes | TriggerOrderTypes) =>
              setTradeType(type)
            }
          >
            {orderTypes.map((type) => (
              <Select.Option key={type} value={type}>
                <div className="flex w-full items-center justify-between">
                  {t(type)}
                </div>
              </Select.Option>
            ))}
          </Select>
        )}
      </div>
      {tradeForm.tradeType === 'Market' &&
      selectedMarket instanceof Serum3Market ? (
        <SpotMarketOrderSwapForm />
      ) : (
        <>
          <form onSubmit={(e) => handleSubmit(e)} noValidate>
            <div className="mt-3 px-3 md:px-4">
              {tradeForm.tradeType === 'Limit' || isTriggerOrder ? (
                <>
                  <div className="mb-2 mt-3 flex items-center justify-between">
                    <p className="text-xs text-th-fgd-3">
                      {isTriggerOrder
                        ? t('trade:trigger-price')
                        : t('trade:limit-price')}
                    </p>
                    {tradeForm.price ? (
                      <TradePriceDifference
                        currentPrice={oraclePrice}
                        newPrice={parseFloat(tradeForm.price)}
                      />
                    ) : null}
                  </div>
                  <div className="relative">
                    {quoteLogoURI ? (
                      <div className={INPUT_PREFIX_CLASSNAMES}>
                        <Image
                          alt=""
                          width="20"
                          height="20"
                          src={quoteLogoURI}
                        />
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
                      decimalScale={tickDecimals}
                      name="price"
                      id="price"
                      className="flex w-full items-center rounded-md border border-th-input-border bg-th-input-bkg p-2 pl-9 font-mono text-sm font-bold text-th-fgd-1 focus:border-th-fgd-4 focus:outline-none md:hover:border-th-input-border-hover md:hover:focus-visible:border-th-fgd-4 lg:text-base"
                      placeholder="0.00"
                      value={tradeForm.price}
                      onValueChange={handlePriceChange}
                    />
                    <div className={INPUT_SUFFIX_CLASSNAMES}>{quoteSymbol}</div>
                  </div>
                  {formErrors.price ? (
                    <div className="mt-1">
                      <InlineNotification
                        type="error"
                        desc={formErrors.price}
                        hideBorder
                        hidePadding
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
              <div className="mb-2 mt-3 flex items-center justify-between">
                <p className="text-xs text-th-fgd-3">{t('trade:size')}</p>
                {!isTriggerOrder ? (
                  <MaxSizeButton
                    minOrderDecimals={minOrderDecimals}
                    tickDecimals={tickDecimals}
                    useMargin={savedCheckboxSettings.margin}
                  />
                ) : (
                  <TriggerOrderMaxButton
                    minOrderDecimals={minOrderDecimals}
                    tickDecimals={tickDecimals}
                  />
                )}
              </div>
              <div className="flex flex-col">
                <div className="relative">
                  <NumberFormat
                    inputMode="decimal"
                    thousandSeparator=","
                    allowNegative={false}
                    isNumericString={true}
                    decimalScale={minOrderDecimals}
                    name="base"
                    id="base"
                    className="relative flex w-full items-center rounded-md rounded-b-none border border-th-input-border bg-th-input-bkg p-2 pl-9 font-mono text-sm font-bold text-th-fgd-1 focus:z-10 focus:border-th-fgd-4 focus:outline-none md:hover:z-10 md:hover:border-th-input-border-hover md:hover:focus:border-th-fgd-4 lg:text-base"
                    placeholder="0.00"
                    value={tradeForm.baseSize}
                    onValueChange={handleBaseSizeChange}
                  />
                  <div className={`z-10 ${INPUT_PREFIX_CLASSNAMES}`}>
                    <LogoWithFallback
                      alt=""
                      className="drop-shadow-md"
                      width={'24'}
                      height={'24'}
                      src={
                        baseLogoURI || `/icons/${baseSymbol?.toLowerCase()}.svg`
                      }
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
                    decimalScale={tickDecimals}
                    name="quote"
                    id="quote"
                    className="mt-[-1px] flex w-full items-center rounded-md rounded-t-none border border-th-input-border bg-th-input-bkg p-2 pl-9 font-mono text-sm font-bold text-th-fgd-1 focus:border-th-fgd-4 focus:outline-none md:hover:border-th-input-border-hover md:hover:focus:border-th-fgd-4 lg:text-base"
                    placeholder="0.00"
                    value={tradeForm.quoteSize}
                    onValueChange={handleQuoteSizeChange}
                  />
                  <div className={INPUT_SUFFIX_CLASSNAMES}>{quoteSymbol}</div>
                </div>
                {formErrors.baseSize ? (
                  <div className="mt-1">
                    <InlineNotification
                      type="error"
                      desc={formErrors.baseSize}
                      hideBorder
                      hidePadding
                    />
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-2 flex">
              {selectedMarket instanceof Serum3Market ? (
                tradeFormSizeUi === 'slider' ? (
                  <SpotSlider
                    minOrderDecimals={minOrderDecimals}
                    tickDecimals={tickDecimals}
                    step={spotMax / 100}
                    useMargin={savedCheckboxSettings.margin}
                    isTriggerOrder={isTriggerOrder}
                  />
                ) : (
                  <SpotButtonGroup
                    minOrderDecimals={minOrderDecimals}
                    tickDecimals={tickDecimals}
                    useMargin={savedCheckboxSettings.margin}
                    isTriggerOrder={isTriggerOrder}
                  />
                )
              ) : tradeFormSizeUi === 'slider' ? (
                <PerpSlider
                  minOrderDecimals={minOrderDecimals}
                  tickDecimals={tickDecimals}
                />
              ) : (
                <PerpButtonGroup
                  minOrderDecimals={minOrderDecimals}
                  tickDecimals={tickDecimals}
                />
              )}
            </div>
            <div className="flex flex-wrap px-5 md:flex-nowrap">
              {tradeForm.tradeType === 'Limit' ? (
                <div className="flex">
                  <div className="mr-3 mt-4" id="trade-step-six">
                    <Tooltip
                      className="hidden md:block"
                      delay={100}
                      placement="left"
                      content={t('trade:tooltip-post')}
                    >
                      <Checkbox
                        checked={tradeForm.postOnly}
                        onChange={(e) => handlePostOnlyChange(e.target.checked)}
                      >
                        {t('trade:post')}
                      </Checkbox>
                    </Tooltip>
                  </div>
                  <div className="mr-3 mt-4" id="trade-step-seven">
                    <Tooltip
                      className="hidden md:block"
                      delay={100}
                      placement="left"
                      content={t('trade:tooltip-ioc')}
                    >
                      <div className="flex items-center text-xs text-th-fgd-3">
                        <Checkbox
                          checked={tradeForm.ioc}
                          onChange={(e) => handleIocChange(e.target.checked)}
                        >
                          IOC
                        </Checkbox>
                      </div>
                    </Tooltip>
                  </div>
                </div>
              ) : null}
              {isTriggerOrder ? null : selectedMarket instanceof
                Serum3Market ? (
                <div className="mt-4" id="trade-step-eight">
                  <Tooltip
                    className="hidden md:block"
                    delay={100}
                    placement="left"
                    content={t('trade:tooltip-enable-margin')}
                  >
                    <Checkbox
                      checked={savedCheckboxSettings.margin}
                      disabled={isSanctioned}
                      onChange={handleSetMargin}
                    >
                      {t('trade:margin')}
                    </Checkbox>
                  </Tooltip>
                </div>
              ) : (
                <div className="mr-3 mt-4">
                  <Tooltip
                    className="hidden md:block"
                    delay={100}
                    placement="left"
                    content={
                      'Reduce will only decrease the size of an open position. This is often used for closing a position.'
                    }
                  >
                    <div className="flex items-center text-xs text-th-fgd-3">
                      <Checkbox
                        checked={
                          tradeForm.reduceOnly || isForceReduceOnly === true
                        }
                        onChange={(e) =>
                          handleReduceOnlyChange(e.target.checked)
                        }
                        disabled={isForceReduceOnly}
                      >
                        {t('trade:reduce-only')}
                      </Checkbox>
                    </div>
                  </Tooltip>
                </div>
              )}
            </div>
            <div className="mb-4 mt-6 flex px-3 md:px-4">
              <TradeformSubmitButton
                disabled={disabled}
                isForceReduceOnly={isForceReduceOnly}
                isSanctioned={isSanctioned}
                placingOrder={placingOrder}
                setShowCreateAccountModal={setShowCreateAccountModal}
                setShowDepositModal={setShowDepositModal}
                sideNames={sideNames}
                tooMuchSize={tooMuchSize}
                useMargin={savedCheckboxSettings.margin}
              />
            </div>
          </form>
          {initHealth <= 0 ? (
            <div className="mb-4 px-4">
              <InlineNotification
                type="warning"
                desc={
                  tradeForm.tradeType === 'Limit'
                    ? t('trade:warning-init-health-limit')
                    : t('trade:warning-init-health')
                }
              />
            </div>
          ) : null}
          {tradeForm.tradeType === 'Market' &&
          selectedMarket instanceof PerpMarket ? (
            <div className="mb-4 px-4">
              <InlineNotification
                type="warning"
                desc={t('trade:price-expect')}
              />
            </div>
          ) : null}
          {!isInsured &&
          ((selectedMarket instanceof Serum3Market &&
            tradeForm.side === 'buy') ||
            selectedMarket instanceof PerpMarket) ? (
            <div className="mb-4 px-4">
              <UninsuredNotification
                name={
                  selectedMarket instanceof Serum3Market
                    ? baseBank?.name
                    : selectedMarket.name
                }
              />
            </div>
          ) : null}
          {perpSlotsFull && mangoAccountAddress ? (
            <div className="mb-4 px-4">
              <AccountSlotsFullNotification
                message={t('trade:error-perp-positions-full')}
              />
            </div>
          ) : null}
          {serumSlotsFull && mangoAccountAddress ? (
            <div className="mb-4 px-4">
              <AccountSlotsFullNotification
                message={t('trade:error-serum-positions-full')}
              />
            </div>
          ) : null}
          {tokenPositionsFull &&
          selectedMarket instanceof Serum3Market &&
          mangoAccountAddress ? (
            <div className="mb-4 px-4">
              <AccountSlotsFullNotification
                message={t('error-token-positions-full')}
              />
            </div>
          ) : null}
          {borrowExceedsLimitInPeriod &&
          remainingBorrowsInPeriod &&
          timeToNextPeriod ? (
            <div className="mb-4 px-4">
              <InlineNotification
                type="error"
                desc={t('error-borrow-exceeds-limit', {
                  remaining: formatCurrencyValue(remainingBorrowsInPeriod),
                  resetTime: dayjs().to(
                    dayjs().add(timeToNextPeriod, 'second'),
                  ),
                })}
              />
            </div>
          ) : null}
          {isSanctioned && hasPosition ? (
            <div className="mb-4 px-4">
              <InlineNotification
                type="error"
                desc={t('trade:error-sanctioned-reduce-only')}
              />
            </div>
          ) : null}
          {isTriggerOrder ? (
            <div className="mb-4 px-4">
              <InlineNotification
                desc={
                  <div>
                    <span className="mr-1">{t('swap:trigger-beta')}</span>
                    <Tooltip
                      content={
                        <ul className="ml-4 list-disc space-y-2">
                          <li>
                            Trigger orders on long-tail assets could be
                            susceptible to oracle manipulation.
                          </li>
                          <li>
                            Trigger orders rely on a sufficient amount of well
                            collateralized liquidators.
                          </li>
                          <li>
                            The slippage on existing orders could be
                            higher/lower than what&apos;s estimated.
                          </li>
                          <li>
                            The amount of tokens used to fill your order can
                            vary and depends on the final execution price.
                          </li>
                        </ul>
                      }
                    >
                      <span className="tooltip-underline whitespace-nowrap">
                        {t('swap:important-info')}
                      </span>
                    </Tooltip>
                  </div>
                }
                type="info"
              />
            </div>
          ) : null}
          <TradeSummary balanceBank={balanceBank} mangoAccount={mangoAccount} />
        </>
      )}
      {showDepositModal ? (
        <DepositWithdrawModal
          action="deposit"
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          token={
            selectedMarket instanceof Serum3Market
              ? tradeForm.side === 'buy'
                ? quoteBank?.name
                : baseBank?.name
              : 'USDC'
          }
        />
      ) : null}
      {showCreateAccountModal ? (
        <CreateAccountModal
          isOpen={showCreateAccountModal}
          onClose={() => setShowCreateAccountModal(false)}
        />
      ) : null}
    </div>
  )
}

export default AdvancedTradeForm
