import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from 'react'
import { ArrowDownIcon, ArrowsRightLeftIcon } from '@heroicons/react/20/solid'
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
import Button, { IconButton } from '@components/shared/Button'
import Loading from '@components/shared/Loading'
import TokenLogo from '@components/shared/TokenLogo'
import InlineNotification from '@components/shared/InlineNotification'

type LimitSwapFormProps = {
  showTokenSelect: 'input' | 'output' | undefined
  setShowTokenSelect: Dispatch<SetStateAction<'input' | 'output' | undefined>>
}

type LimitSwapForm = {
  amountIn: number
  triggerPrice: string
}
type FormErrors = Partial<Record<keyof LimitSwapForm, string>>

const set = mangoStore.getState().set

const LimitSwapForm = ({
  showTokenSelect,
  setShowTokenSelect,
}: LimitSwapFormProps) => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [triggerPrice, setTriggerPrice] = useState('')
  const [flipPrices, setFlipPrices] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [swapFormSizeUi] = useLocalStorageState(SIZE_INPUT_UI_KEY, 'slider')
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const {
    margin: useMargin,
    inputBank,
    outputBank,
    amountIn: amountInFormValue,
    amountOut: amountOutFormValue,
    limitPrice,
  } = mangoStore((s) => s.swap)

  const amountInAsDecimal: Decimal | null = useMemo(() => {
    return Number(amountInFormValue)
      ? new Decimal(amountInFormValue)
      : new Decimal(0)
  }, [amountInFormValue])

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

  const [quotePrice, flippedQuotePrice] = useMemo(() => {
    if (!inputBank || !outputBank) return [0, 0]
    const quote = floorToDecimal(
      inputBank.uiPrice / outputBank.uiPrice,
      outputBank.mintDecimals,
    ).toNumber()
    const flipped = floorToDecimal(
      outputBank.uiPrice / inputBank.uiPrice,
      inputBank.mintDecimals,
    ).toNumber()
    return [quote, flipped]
  }, [inputBank, outputBank])

  // set default limit and trigger price
  useEffect(() => {
    if (!quotePrice) return
    if (!triggerPrice && !showTokenSelect) {
      setTriggerPrice(quotePrice.toFixed(outputBank?.mintDecimals))
    }
  }, [quotePrice, outputBank, showTokenSelect, triggerPrice])

  const triggerPriceDifference = useMemo(() => {
    if ((!flipPrices && !quotePrice) || (flipPrices && !flippedQuotePrice))
      return 0
    const oraclePrice = !flipPrices ? quotePrice : flippedQuotePrice
    const triggerDifference = triggerPrice
      ? ((parseFloat(triggerPrice) - oraclePrice) / oraclePrice) * 100
      : 0
    return triggerDifference
  }, [flippedQuotePrice, quotePrice, triggerPrice])

  const handleTokenSelect = (type: 'input' | 'output') => {
    setShowTokenSelect(type)
    setTriggerPrice('')
  }

  const isFormValid = useCallback((form: LimitSwapForm) => {
    const invalidFields: FormErrors = {}
    setFormErrors({})
    const requiredFields: (keyof LimitSwapForm)[] = ['amountIn', 'triggerPrice']
    for (const key of requiredFields) {
      const value = form[key] as string
      if (!value) {
        invalidFields[key] = t('settings:error-required-field')
      }
    }
    if (Object.keys(invalidFields).length) {
      setFormErrors(invalidFields)
    }
    return invalidFields
  }, [])

  /* 
    If the use margin setting is toggled, clear the form values
  */
  useEffect(() => {
    setAmountInFormValue('')
    setAmountOutFormValue('')
  }, [useMargin, setAmountInFormValue, setAmountOutFormValue])

  // get the out amount from the in amount and trigger or limit price
  const getAmountOut = useCallback(
    (amountIn: string, price: string) => {
      const amountOut = !flipPrices
        ? floorToDecimal(
            parseFloat(amountIn) * parseFloat(price),
            outputBank?.mintDecimals || 0,
          )
        : floorToDecimal(
            parseFloat(amountIn) / parseFloat(price),
            outputBank?.mintDecimals || 0,
          )
      return amountOut
    },
    [outputBank, flipPrices],
  )

  // get the in amount from the out amount and trigger or limit price
  const getAmountIn = useCallback(
    (amountOut: string, price: string) => {
      const amountIn = !flipPrices
        ? floorToDecimal(
            parseFloat(amountOut) / parseFloat(price),
            inputBank?.mintDecimals || 0,
          )
        : floorToDecimal(
            parseFloat(amountOut) * parseFloat(price),
            inputBank?.mintDecimals || 0,
          )
      return amountIn
    },
    [inputBank, outputBank, flipPrices],
  )

  const handleMax = useCallback(
    (amountIn: string) => {
      setAmountInFormValue(amountIn)
      if (parseFloat(amountIn) > 0 && triggerPrice) {
        const amountOut = getAmountOut(amountIn, triggerPrice)
        setAmountOutFormValue(amountOut.toString())
      }
    },
    [getAmountOut, setAmountInFormValue, setAmountOutFormValue, triggerPrice],
  )

  const handleRepay = useCallback(
    (amountOut: string) => {
      setAmountOutFormValue(amountOut)
      if (parseFloat(amountOut) > 0 && triggerPrice) {
        const amountIn = getAmountIn(amountOut, triggerPrice)
        setAmountInFormValue(amountIn.toString())
      }
    },
    [getAmountIn, setAmountInFormValue, setAmountOutFormValue, triggerPrice],
  )

  const handleAmountInChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setFormErrors({})
      setAmountInFormValue(e.value)
      if (parseFloat(e.value) > 0 && triggerPrice) {
        const amountOut = getAmountOut(e.value, triggerPrice)
        setAmountOutFormValue(amountOut.toString())
      }
    },
    [getAmountOut, setAmountInFormValue, setAmountOutFormValue, triggerPrice],
  )

  const handleAmountOutChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setAmountOutFormValue(e.value)
      if (parseFloat(e.value) > 0 && triggerPrice) {
        const amountIn = getAmountIn(e.value, triggerPrice)
        setAmountInFormValue(amountIn.toString())
      }
    },
    [getAmountIn, setAmountInFormValue, setAmountOutFormValue, triggerPrice],
  )

  const handleAmountInUi = useCallback(
    (amountIn: string) => {
      setAmountInFormValue(amountIn)
      setFormErrors({})
      if (triggerPrice) {
        const amountOut = getAmountOut(amountIn, triggerPrice)
        setAmountOutFormValue(amountOut.toString())
      }
    },
    [getAmountOut, setAmountInFormValue, setAmountOutFormValue, triggerPrice],
  )

  const handleTriggerPrice = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setFormErrors({})
      setTriggerPrice(e.value)
      if (parseFloat(e.value) > 0 && parseFloat(amountInFormValue) > 0) {
        const amountOut = getAmountOut(amountInFormValue, e.value)
        setAmountOutFormValue(amountOut.toString())
      }
    },
    [amountInFormValue, flipPrices, setTriggerPrice],
  )

  const handleSwitchTokens = useCallback(() => {
    if (amountInAsDecimal?.gt(0) && triggerPrice) {
      const amountOut = amountInAsDecimal.div(triggerPrice)
      setAmountOutFormValue(amountOut.toString())
    }
    set((s) => {
      s.swap.inputBank = outputBank
      s.swap.outputBank = inputBank
    })

    if (flippedQuotePrice) {
      setTriggerPrice(flippedQuotePrice.toFixed(inputBank?.mintDecimals))
    }
    setAnimateSwitchArrow(
      (prevanimateSwitchArrow) => prevanimateSwitchArrow + 1,
    )
  }, [
    setAmountInFormValue,
    amountInAsDecimal,
    flipPrices,
    flippedQuotePrice,
    inputBank,
    outputBank,
    triggerPrice,
  ])

  const handlePlaceStopLoss = useCallback(async () => {
    const invalidFields = isFormValid({
      amountIn: amountInAsDecimal.toNumber(),
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

      const inputMint = !flipPrices ? inputBank.mint : outputBank.mint
      const outputMint = !flipPrices ? outputBank.mint : inputBank.mint
      const amountIn = !flipPrices
        ? amountInAsDecimal.toNumber()
        : parseFloat(amountOutFormValue)

      try {
        const tx = await client.tokenConditionalSwapStopLoss(
          group,
          mangoAccount,
          inputMint,
          parseFloat(triggerPrice),
          outputMint,
          null,
          amountIn,
          null,
          null,
        )
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: tx,
          noSound: true,
        })
        actions.fetchGroup()
        await actions.reloadMangoAccount()
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
    flipPrices,
    limitPrice,
    triggerPrice,
    amountInAsDecimal,
    amountOutFormValue,
  ])

  const triggerPriceLabel = useMemo(() => {
    if (!inputBank || !outputBank) return t('trade:trigger-price')
    if (inputBank.name === 'USDC') {
      return t('trade:trigger-order-rate', {
        side: t('buy').toLowerCase(),
        symbol: outputBank.name,
      })
    } else {
      return t('trade:trigger-order-rate', {
        side: t('sell').toLowerCase(),
        symbol: inputBank.name,
      })
    }
  }, [inputBank, outputBank])

  const handleFlipPrices = useCallback(
    (flip: boolean) => {
      setFlipPrices(flip)
      if (flip) {
        setTriggerPrice(flippedQuotePrice.toFixed(inputBank?.mintDecimals))
      } else {
        setTriggerPrice(quotePrice.toFixed(outputBank?.mintDecimals))
      }
    },
    [flippedQuotePrice, inputBank, outputBank, quotePrice],
  )

  return (
    <>
      <SellTokenInput
        className="rounded-b-none"
        error={formErrors.amountIn}
        handleAmountInChange={handleAmountInChange}
        setShowTokenSelect={() => handleTokenSelect('input')}
        handleMax={handleMax}
      />
      <div
        className={`grid grid-cols-2 gap-2 rounded-b-xl bg-th-bkg-2 p-3 pt-1`}
        id="swap-step-two"
      >
        <div className="col-span-2">
          <p className="mb-2 text-th-fgd-2">
            {triggerPriceLabel}{' '}
            <span className="text-xs text-th-fgd-3">
              {triggerPriceDifference
                ? `(${triggerPriceDifference.toFixed(2)}%)`
                : ''}
            </span>
          </p>
          <div className="relative">
            <NumberFormat
              inputMode="decimal"
              thousandSeparator=","
              allowNegative={false}
              isNumericString={true}
              decimalScale={outputBank?.mintDecimals || 6}
              name="triggerPrice"
              id="triggerPrice"
              className="h-10 w-full rounded-lg bg-th-input-bkg p-3 pl-8 font-mono text-sm text-th-fgd-1 focus:outline-none md:hover:bg-th-bkg-1"
              placeholder="0.00"
              value={triggerPrice}
              onValueChange={handleTriggerPrice}
              isAllowed={withValueLimit}
            />
            <div className="absolute top-1/2 -translate-y-1/2 left-2">
              <TokenLogo bank={flipPrices ? inputBank : outputBank} size={16} />
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-2">
              <IconButton hideBg onClick={() => handleFlipPrices(!flipPrices)}>
                <ArrowsRightLeftIcon className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
          {formErrors.triggerPrice ? (
            <div className="mt-1">
              <InlineNotification
                type="error"
                desc={formErrors.triggerPrice}
                hideBorder
                hidePadding
              />
            </div>
          ) : null}
        </div>
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
        handleAmountOutChange={handleAmountOutChange}
        setShowTokenSelect={() => handleTokenSelect('output')}
        handleRepay={handleRepay}
      />
      {swapFormSizeUi === 'slider' ? (
        <SwapSlider
          useMargin={useMargin}
          amount={amountInAsDecimal.toNumber()}
          onChange={(v) => handleAmountInUi(v)}
          step={1 / 10 ** (inputBank?.mintDecimals || 6)}
        />
      ) : (
        <PercentageSelectButtons
          amountIn={amountInAsDecimal.toString()}
          setAmountIn={(v) => handleAmountInUi(v)}
          useMargin={useMargin}
        />
      )}
      <Button
        onClick={handlePlaceStopLoss}
        className="mt-6 mb-4 flex w-full items-center justify-center text-base"
        size="large"
      >
        {submitting ? <Loading /> : t('swap:place-limit-order')}
      </Button>
    </>
  )
}

export default LimitSwapForm
