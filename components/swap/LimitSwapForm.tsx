import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
  useLayoutEffect,
} from 'react'
import {
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  LinkIcon,
} from '@heroicons/react/20/solid'
import NumberFormat, {
  NumberFormatValues,
  SourceInfo,
} from 'react-number-format'
import Decimal from 'decimal.js'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { SIZE_INPUT_UI_KEY } from '../../utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'
import SwapSlider from './SwapSlider'
import PercentageSelectButtons from './PercentageSelectButtons'
import { floorToDecimal } from 'utils/numbers'
import { withValueLimit } from './MarketSwapForm'
import SellTokenInput from './SellTokenInput'
import BuyTokenInput from './BuyTokenInput'
import { notify } from 'utils/notifications'
import * as sentry from '@sentry/nextjs'
import { isMangoError } from 'types'
import Button, { LinkButton } from '@components/shared/Button'
import Loading from '@components/shared/Loading'
import TokenLogo from '@components/shared/TokenLogo'
import InlineNotification from '@components/shared/InlineNotification'
import Select from '@components/forms/Select'
import useIpAddress from 'hooks/useIpAddress'
import { Bank, toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import useMangoAccount from 'hooks/useMangoAccount'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTokenMax } from './useTokenMax'
import DepositWithdrawModal from '@components/modals/DepositWithdrawModal'

type LimitSwapFormProps = {
  showTokenSelect: 'input' | 'output' | undefined
  setShowTokenSelect: Dispatch<SetStateAction<'input' | 'output' | undefined>>
}

type LimitSwapForm = {
  amountIn: number
  hasBorrows: number | undefined
  triggerPrice: string
}

type FormErrors = Partial<Record<keyof LimitSwapForm, string>>

type OrderTypeMultiplier = 0.9 | 1 | 1.1

enum OrderTypes {
  STOP_LOSS = 'trade:stop-loss',
  TAKE_PROFIT = 'trade:take-profit',
  REPAY_BORROW = 'repay-borrow',
}

const ORDER_TYPES = [
  OrderTypes.STOP_LOSS,
  OrderTypes.TAKE_PROFIT,
  OrderTypes.REPAY_BORROW,
]

const set = mangoStore.getState().set

const getSellTokenBalance = (inputBank: Bank | undefined) => {
  const mangoAccount = mangoStore.getState().mangoAccount.current
  if (!inputBank || !mangoAccount) return 0
  const balance = mangoAccount.getTokenBalanceUi(inputBank)
  return balance
}

const getOrderTypeMultiplier = (orderType: OrderTypes, flipPrices: boolean) => {
  if (orderType === OrderTypes.STOP_LOSS) {
    return flipPrices ? 1.1 : 0.9
  } else if (orderType === OrderTypes.TAKE_PROFIT) {
    return flipPrices ? 0.9 : 1.1
  } else {
    return 1
  }
}

const LimitSwapForm = ({
  showTokenSelect,
  setShowTokenSelect,
}: LimitSwapFormProps) => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const { ipAllowed, ipCountry } = useIpAddress()
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [triggerPrice, setTriggerPrice] = useState('')
  const [orderType, setOrderType] = useState(ORDER_TYPES[0])
  const [orderTypeMultiplier, setOrderTypeMultiplier] =
    useState<OrderTypeMultiplier | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [swapFormSizeUi] = useLocalStorageState(SIZE_INPUT_UI_KEY, 'slider')
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const {
    inputBank,
    outputBank,
    amountIn: amountInFormValue,
    amountOut: amountOutFormValue,
    flipPrices,
  } = mangoStore((s) => s.swap)

  const { connected, connect } = useWallet()
  const { amount: tokenMax } = useTokenMax()
  const [showDepositModal, setShowDepositModal] = useState(false)

  const [inputBankName, outputBankName, inputBankDecimals, outputBankDecimals] =
    useMemo(() => {
      if (!inputBank || !outputBank) return ['', '', 0, 0]
      return [
        inputBank.name,
        outputBank.name,
        inputBank.mintDecimals,
        outputBank.mintDecimals,
      ]
    }, [inputBank, outputBank])

  const amountInAsDecimal: Decimal | null = useMemo(() => {
    return Number(amountInFormValue)
      ? new Decimal(amountInFormValue)
      : new Decimal(0)
  }, [amountInFormValue])

  const amountOutAsDecimal: Decimal | null = useMemo(() => {
    return Number(amountOutFormValue)
      ? new Decimal(amountOutFormValue)
      : new Decimal(0)
  }, [amountOutFormValue])

  const freeCollateral = useMemo(() => {
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    return group && mangoAccount
      ? toUiDecimalsForQuote(mangoAccount.getCollateralValue(group))
      : 0
  }, [mangoAccountAddress])

  const showInsufficientBalance =
    tokenMax.lt(amountInAsDecimal) || tokenMax.eq(0)

  const setAmountInFormValue = useCallback((amountIn: string) => {
    set((s) => {
      s.swap.amountIn = amountIn
      if (!parseFloat(amountIn)) {
        s.swap.amountOut = ''
      }
    })
  }, [])

  const setAmountOutFormValue = useCallback((amountOut: string) => {
    set((s) => {
      s.swap.amountOut = amountOut
      if (!parseFloat(amountOut)) {
        s.swap.amountIn = ''
      }
    })
  }, [])

  const quotePrice = useMemo(() => {
    if (!inputBank || !outputBank) return 0
    const quote = flipPrices
      ? floorToDecimal(
          outputBank.uiPrice / inputBank.uiPrice,
          inputBank.mintDecimals,
        ).toNumber()
      : floorToDecimal(
          inputBank.uiPrice / outputBank.uiPrice,
          outputBank.mintDecimals,
        ).toNumber()
    return quote
  }, [flipPrices, inputBank, outputBank])

  // set default trigger price
  useEffect(() => {
    if (!quotePrice || triggerPrice || showTokenSelect) return
    const multiplier = getOrderTypeMultiplier(OrderTypes.STOP_LOSS, flipPrices)
    const decimals = !flipPrices ? inputBankDecimals : outputBankDecimals
    setTriggerPrice((quotePrice * multiplier).toFixed(decimals))
  }, [
    flipPrices,
    inputBankDecimals,
    outputBankDecimals,
    quotePrice,
    showTokenSelect,
    triggerPrice,
  ])

  // flip trigger price and set amount out when chart direction is flipped
  useLayoutEffect(() => {
    if (!quotePrice) return
    const multiplier = getOrderTypeMultiplier(orderType, flipPrices)
    const decimals = flipPrices ? inputBankDecimals : outputBankDecimals
    const price = (quotePrice * multiplier).toFixed(decimals)
    setTriggerPrice(price)
    if (amountInAsDecimal?.gt(0)) {
      const amountOut = getAmountOut(
        amountInAsDecimal.toString(),
        flipPrices,
        price,
      )
      setAmountOutFormValue(amountOut.toString())
    }
  }, [flipPrices, inputBankDecimals, orderType, outputBankDecimals])

  const triggerPriceDifference = useMemo(() => {
    if (!quotePrice) return 0
    const triggerDifference = triggerPrice
      ? ((parseFloat(triggerPrice) - quotePrice) / quotePrice) * 100
      : 0
    return triggerDifference
  }, [quotePrice, triggerPrice])

  const handleTokenSelect = (type: 'input' | 'output') => {
    setShowTokenSelect(type)
    setFormErrors({})
    setTriggerPrice('')
  }

  const hasBorrowToRepay = useMemo(() => {
    if (orderType !== OrderTypes.REPAY_BORROW || !outputBank || !mangoAccount)
      return
    const balance = mangoAccount.getTokenBalanceUi(outputBank)
    const roundedBalance = floorToDecimal(
      balance,
      outputBank.mintDecimals,
    ).toNumber()
    return balance && balance < 0 ? Math.abs(roundedBalance) : 0
  }, [mangoAccount, orderType, outputBank])

  const isFormValid = useCallback(
    (form: LimitSwapForm) => {
      const invalidFields: FormErrors = {}
      setFormErrors({})
      const requiredFields: (keyof LimitSwapForm)[] = [
        'amountIn',
        'triggerPrice',
      ]
      const triggerPriceNumber = parseFloat(form.triggerPrice)
      const sellTokenBalance = getSellTokenBalance(inputBank)
      for (const key of requiredFields) {
        const value = form[key] as string
        if (!value) {
          invalidFields[key] = t('settings:error-required-field')
        }
      }
      if (orderType === OrderTypes.STOP_LOSS) {
        if (flipPrices && triggerPriceNumber <= quotePrice) {
          invalidFields.triggerPrice =
            'Trigger price must be above oracle price'
        }
        if (!flipPrices && triggerPriceNumber >= quotePrice) {
          invalidFields.triggerPrice =
            'Trigger price must be below oracle price'
        }
      }
      if (orderType === OrderTypes.TAKE_PROFIT) {
        if (flipPrices && triggerPriceNumber >= quotePrice) {
          invalidFields.triggerPrice =
            'Trigger price must be below oracle price'
        }
        if (!flipPrices && triggerPriceNumber <= quotePrice) {
          invalidFields.triggerPrice =
            'Trigger price must be above oracle price'
        }
      }
      if (orderType === OrderTypes.REPAY_BORROW && !hasBorrowToRepay) {
        invalidFields.hasBorrows = t('swap:no-borrow')
      }
      if (form.amountIn > sellTokenBalance) {
        invalidFields.amountIn = t('swap:insufficient-balance', {
          symbol: inputBank?.name,
        })
      }
      if (Object.keys(invalidFields).length) {
        setFormErrors(invalidFields)
      }
      return invalidFields
    },
    [
      flipPrices,
      hasBorrowToRepay,
      inputBank,
      orderType,
      quotePrice,
      setFormErrors,
    ],
  )

  // set order type multiplier on page load
  useEffect(() => {
    if (!orderTypeMultiplier) {
      const multiplier = getOrderTypeMultiplier(orderType, flipPrices)
      setOrderTypeMultiplier(multiplier)
    }
  }, [flipPrices, orderType, orderTypeMultiplier])

  // get the out amount from the in amount and trigger or limit price
  const getAmountOut = useCallback(
    (amountIn: string, flipPrices: boolean, price: string) => {
      const amountOut = flipPrices
        ? floorToDecimal(
            parseFloat(amountIn) / parseFloat(price),
            outputBank?.mintDecimals || 0,
          )
        : floorToDecimal(
            parseFloat(amountIn) * parseFloat(price),
            outputBank?.mintDecimals || 0,
          )
      return amountOut
    },
    [outputBank],
  )

  // get the in amount from the out amount and trigger or limit price
  const getAmountIn = useCallback(
    (amountOut: string, flipPrices: boolean, price: string) => {
      const amountIn = flipPrices
        ? floorToDecimal(
            parseFloat(amountOut) * parseFloat(price),
            inputBank?.mintDecimals || 0,
          )
        : floorToDecimal(
            parseFloat(amountOut) / parseFloat(price),
            inputBank?.mintDecimals || 0,
          )
      return amountIn
    },
    [inputBank, outputBank],
  )

  const handleMax = useCallback(
    (amountIn: string) => {
      setAmountInFormValue(amountIn)
      if (parseFloat(amountIn) > 0 && triggerPrice) {
        const amountOut = getAmountOut(amountIn, flipPrices, triggerPrice)
        setAmountOutFormValue(amountOut.toString())
      }
    },
    [
      flipPrices,
      getAmountOut,
      setAmountInFormValue,
      setAmountOutFormValue,
      triggerPrice,
    ],
  )

  const handleRepay = useCallback(
    (amountOut: string) => {
      setAmountOutFormValue(amountOut)
      if (parseFloat(amountOut) > 0 && triggerPrice) {
        const amountIn = getAmountIn(amountOut, flipPrices, triggerPrice)
        setAmountInFormValue(amountIn.toString())
      }
    },
    [
      flipPrices,
      getAmountIn,
      setAmountInFormValue,
      setAmountOutFormValue,
      triggerPrice,
    ],
  )

  const handleAmountInChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setFormErrors({})
      setAmountInFormValue(e.value)
      if (parseFloat(e.value) > 0 && triggerPrice) {
        const amountOut = getAmountOut(e.value, flipPrices, triggerPrice)
        setAmountOutFormValue(amountOut.toString())
      }
    },
    [
      flipPrices,
      getAmountOut,
      setAmountInFormValue,
      setAmountOutFormValue,
      setFormErrors,
      triggerPrice,
    ],
  )

  const handleAmountOutChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setFormErrors({})
      setAmountOutFormValue(e.value)
      if (parseFloat(e.value) > 0 && triggerPrice) {
        const amountIn = getAmountIn(e.value, flipPrices, triggerPrice)
        setAmountInFormValue(amountIn.toString())
      }
    },
    [
      flipPrices,
      getAmountIn,
      setAmountInFormValue,
      setAmountOutFormValue,
      setFormErrors,
      triggerPrice,
    ],
  )

  const handleAmountInUi = useCallback(
    (amountIn: string) => {
      setAmountInFormValue(amountIn)
      setFormErrors({})
      if (triggerPrice) {
        const amountOut = getAmountOut(amountIn, flipPrices, triggerPrice)
        setAmountOutFormValue(amountOut.toString())
      }
    },
    [
      flipPrices,
      getAmountOut,
      setAmountInFormValue,
      setAmountOutFormValue,
      setFormErrors,
      triggerPrice,
    ],
  )

  const handleTriggerPrice = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setFormErrors({})
      setTriggerPrice(e.value)
      if (parseFloat(e.value) > 0 && parseFloat(amountInFormValue) > 0) {
        const amountOut = getAmountOut(amountInFormValue, flipPrices, e.value)
        setAmountOutFormValue(amountOut.toString())
      }
    },
    [amountInFormValue, flipPrices, setFormErrors, setTriggerPrice],
  )

  const handleSwitchTokens = useCallback(() => {
    if (!inputBank || !outputBank) return
    setFormErrors({})
    set((s) => {
      s.swap.inputBank = outputBank
      s.swap.outputBank = inputBank
    })
    const multiplier = getOrderTypeMultiplier(orderType, flipPrices)
    const price = flipPrices
      ? floorToDecimal(
          (inputBank.uiPrice / outputBank.uiPrice) * multiplier,
          outputBank.mintDecimals,
        ).toString()
      : floorToDecimal(
          (outputBank.uiPrice / inputBank.uiPrice) * multiplier,
          inputBank.mintDecimals,
        ).toString()
    setTriggerPrice(price)

    if (amountInAsDecimal?.gt(0)) {
      const amountOut = getAmountOut(
        amountInAsDecimal.toString(),
        flipPrices,
        price,
      )
      setAmountOutFormValue(amountOut.toString())
    }
    setAnimateSwitchArrow(
      (prevanimateSwitchArrow) => prevanimateSwitchArrow + 1,
    )
  }, [
    amountInAsDecimal,
    flipPrices,
    inputBank,
    orderType,
    outputBank,
    setAmountInFormValue,
    setFormErrors,
    triggerPrice,
  ])

  const handlePlaceStopLoss = useCallback(async () => {
    const invalidFields = isFormValid({
      amountIn: amountInAsDecimal.toNumber(),
      hasBorrows: hasBorrowToRepay,
      triggerPrice,
    })
    if (Object.keys(invalidFields).length) {
      return
    }
    try {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const inputBank = mangoStore.getState().swap.inputBank
      const outputBank = mangoStore.getState().swap.outputBank

      if (!mangoAccount || !group || !inputBank || !outputBank || !triggerPrice)
        return
      setSubmitting(true)

      const amountIn = amountInAsDecimal.toNumber()

      try {
        let tx
        if (orderType === OrderTypes.REPAY_BORROW) {
          const amountOut = amountOutAsDecimal.toNumber()
          const orderPrice = parseFloat(triggerPrice)
          if (quotePrice > orderPrice) {
            tx = await client.tcsStopLossOnBorrow(
              group,
              mangoAccount,
              inputBank,
              outputBank,
              orderPrice,
              flipPrices,
              amountOut,
              null,
              false,
              null,
            )
          } else {
            tx = await client.tcsTakeProfitOnBorrow(
              group,
              mangoAccount,
              inputBank,
              outputBank,
              orderPrice,
              flipPrices,
              amountOut,
              null,
              false,
              null,
            )
          }
        }
        if (orderType === OrderTypes.STOP_LOSS) {
          tx = await client.tcsStopLossOnDeposit(
            group,
            mangoAccount,
            inputBank,
            outputBank,
            parseFloat(triggerPrice),
            flipPrices,
            amountIn,
            null,
            null,
          )
        }
        if (orderType === OrderTypes.TAKE_PROFIT) {
          tx = await client.tcsTakeProfitOnDeposit(
            group,
            mangoAccount,
            inputBank,
            outputBank,
            parseFloat(triggerPrice),
            flipPrices,
            amountIn,
            null,
            null,
          )
        }
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: tx?.signature,
          noSound: true,
        })
        actions.fetchGroup()
        await actions.reloadMangoAccount(tx?.slot)
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
      }
    } catch (e) {
      console.error('Swap error:', e)
    } finally {
      setSubmitting(false)
    }
  }, [
    hasBorrowToRepay,
    flipPrices,
    orderType,
    quotePrice,
    triggerPrice,
    amountInAsDecimal,
    amountOutFormValue,
  ])

  const orderDescription = useMemo(() => {
    if (
      !amountInFormValue ||
      !amountOutFormValue ||
      !inputBankName ||
      !outputBankName ||
      !triggerPrice
    )
      return

    const quoteString = flipPrices
      ? `${inputBankName} per ${outputBankName}`
      : `${outputBankName} per ${inputBankName}`

    if (hasBorrowToRepay && orderType === OrderTypes.REPAY_BORROW) {
      const amountOut = floorToDecimal(
        amountOutFormValue,
        outputBankDecimals,
      ).toNumber()
      if (amountOut <= hasBorrowToRepay) {
        return t('trade:repay-borrow-order-desc', {
          amount: amountOut,
          priceUnit: quoteString,
          symbol: outputBankName,
          triggerPrice: floorToDecimal(triggerPrice, inputBankDecimals),
        })
      } else {
        const depositAmount = floorToDecimal(
          amountOut - hasBorrowToRepay,
          outputBankDecimals,
        ).toNumber()
        return t('trade:repay-borrow-deposit-order-desc', {
          borrowAmount: hasBorrowToRepay,
          depositAmount: depositAmount,
          priceUnit: quoteString,
          symbol: outputBankName,
          triggerPrice: floorToDecimal(triggerPrice, inputBankDecimals),
        })
      }
    } else {
      const orderTypeString =
        orderType === OrderTypes.STOP_LOSS
          ? !flipPrices
            ? t('trade:falls-to')
            : t('trade:rises-to')
          : !flipPrices
          ? t('trade:rises-to')
          : t('trade:falls-to')

      return t('trade:trigger-order-desc', {
        amount: floorToDecimal(amountInFormValue, inputBankDecimals),
        orderType: orderTypeString,
        priceUnit: quoteString,
        symbol: inputBankName,
        triggerPrice: floorToDecimal(triggerPrice, inputBankDecimals),
      })
    }
  }, [
    amountInFormValue,
    amountOutFormValue,
    flipPrices,
    hasBorrowToRepay,
    inputBankDecimals,
    inputBankName,
    orderType,
    outputBankDecimals,
    outputBankName,
    triggerPrice,
  ])

  const triggerPriceSuffix = useMemo(() => {
    if (!inputBankName || !outputBankName) return
    if (flipPrices) {
      return `${inputBankName} per ${outputBankName}`
    } else {
      return `${outputBankName} per ${inputBankName}`
    }
  }, [flipPrices, inputBankName, outputBankName])

  const toggleFlipPrices = useCallback(
    (flip: boolean) => {
      if (!inputBankName || !outputBankName) return
      setFormErrors({})
      set((state) => {
        state.swap.flipPrices = flip
      })
    },
    [inputBankName, outputBankName, setFormErrors],
  )

  const handleOrderTypeChange = useCallback(
    (type: string) => {
      setFormErrors({})
      const newType = type as OrderTypes
      setOrderType(newType)
      const triggerMultiplier = getOrderTypeMultiplier(newType, flipPrices)
      setOrderTypeMultiplier(triggerMultiplier)
      const trigger = (quotePrice * triggerMultiplier).toString()
      setTriggerPrice(trigger)
      if (amountInAsDecimal.gt(0)) {
        const amountOut = getAmountOut(
          amountInAsDecimal.toString(),
          flipPrices,
          trigger,
        ).toString()
        setAmountOutFormValue(amountOut)
      }
    },
    [flipPrices, quotePrice, setFormErrors, setOrderTypeMultiplier],
  )

  const onClick = !connected
    ? connect
    : showInsufficientBalance || freeCollateral <= 0
    ? () => setShowDepositModal(true)
    : handlePlaceStopLoss

  return (
    <>
      <SellTokenInput
        className="rounded-b-none"
        error={formErrors.amountIn}
        handleAmountInChange={handleAmountInChange}
        setShowTokenSelect={() => handleTokenSelect('input')}
        handleMax={handleMax}
        isTriggerOrder
      />
      <div
        className={`grid grid-cols-2 gap-2 rounded-b-xl bg-th-bkg-2 p-3 pt-1`}
        id="swap-step-two"
      >
        <div className="col-span-1">
          <p className="mb-2 text-th-fgd-2">{t('trade:order-type')}</p>
          <Select
            value={t(orderType)}
            onChange={(type) => handleOrderTypeChange(type)}
            className="w-full"
            buttonClassName="ring-transparent rounded-t-lg rounded-b-lg focus:outline-none md:hover:bg-th-bkg-1 md:hover:ring-transparent focus-visible:bg-th-bkg-3 whitespace-nowrap"
          >
            {ORDER_TYPES.map((type) => (
              <Select.Option key={type} value={type}>
                {t(type)}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="col-span-1">
          <div className="mb-2 flex items-end justify-between">
            <p className="text-th-fgd-2">{t('trade:trigger-price')}</p>
            <p
              className={`font-mono text-xs ${
                triggerPriceDifference >= 0 ? 'text-th-up' : 'text-th-down'
              }`}
            >
              {triggerPriceDifference
                ? triggerPriceDifference.toFixed(2)
                : '0.00'}
              %
            </p>
          </div>
          <div className="flex items-center">
            <div className="relative w-full">
              <NumberFormat
                inputMode="decimal"
                thousandSeparator=","
                allowNegative={false}
                isNumericString={true}
                decimalScale={
                  flipPrices ? inputBankDecimals : outputBankDecimals || 6
                }
                name="triggerPrice"
                id="triggerPrice"
                className="h-10 w-full rounded-lg bg-th-input-bkg p-3 pl-8 font-mono text-sm text-th-fgd-1 focus:outline-none md:hover:bg-th-bkg-1"
                placeholder="0.00"
                value={triggerPrice}
                onValueChange={handleTriggerPrice}
                isAllowed={withValueLimit}
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2">
                <TokenLogo
                  bank={flipPrices ? inputBank : outputBank}
                  size={16}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <LinkButton
              className="flex items-center text-xxs font-normal text-th-fgd-3"
              onClick={() => toggleFlipPrices(!flipPrices)}
            >
              <span className="mr-1">{triggerPriceSuffix}</span>
              <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
            </LinkButton>
          </div>
        </div>
        {formErrors.triggerPrice ? (
          <div className="col-span-2 flex justify-center">
            <InlineNotification
              type="error"
              desc={formErrors.triggerPrice}
              hideBorder
              hidePadding
            />
          </div>
        ) : null}
      </div>
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
      <BuyTokenInput
        error={formErrors.hasBorrows}
        handleAmountOutChange={handleAmountOutChange}
        setShowTokenSelect={() => handleTokenSelect('output')}
        handleRepay={
          orderType === OrderTypes.REPAY_BORROW ? handleRepay : undefined
        }
      />
      {swapFormSizeUi === 'slider' ? (
        <SwapSlider
          useMargin={false}
          amount={amountInAsDecimal.toNumber()}
          onChange={(v) => handleAmountInUi(v)}
          step={1 / 10 ** (inputBankDecimals || 6)}
        />
      ) : (
        <PercentageSelectButtons
          amountIn={amountInAsDecimal.toString()}
          setAmountIn={(v) => handleAmountInUi(v)}
          useMargin={false}
        />
      )}
      {orderType === OrderTypes.REPAY_BORROW &&
      !hasBorrowToRepay ? null : orderDescription ? (
        <div className="mt-4">
          <InlineNotification
            desc={
              <>
                {orderType !== OrderTypes.REPAY_BORROW ? (
                  <>
                    <span className="text-th-down">{t('sell')}</span>{' '}
                  </>
                ) : null}
                {orderDescription}
              </>
            }
            type="info"
          />
        </div>
      ) : null}
      {ipAllowed ? (
        <Button
          onClick={onClick}
          className="mb-4 mt-6 flex w-full items-center justify-center text-base"
          size="large"
        >
          {connected ? (
            showInsufficientBalance || freeCollateral <= 0 ? (
              <div className="flex items-center">
                <ArrowDownTrayIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                {t('swap:deposit-funds')}
              </div>
            ) : submitting ? (
              <Loading />
            ) : (
              <span>{t('swap:place-limit-order')}</span>
            )
          ) : (
            <div className="flex items-center">
              <LinkIcon className="mr-2 h-5 w-5" />
              {t('connect')}
            </div>
          )}
        </Button>
      ) : (
        <Button
          disabled
          className="mb-4 mt-6 w-full leading-tight"
          size="large"
        >
          {t('country-not-allowed', {
            country: ipCountry ? `(${ipCountry})` : '',
          })}
        </Button>
      )}
      {showDepositModal ? (
        <DepositWithdrawModal
          action="deposit"
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          token={freeCollateral > 0 ? inputBankName : ''}
        />
      ) : null}
    </>
  )
}

export default LimitSwapForm
