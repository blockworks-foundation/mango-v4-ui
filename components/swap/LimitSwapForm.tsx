import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from 'react'
import { ArrowDownIcon } from '@heroicons/react/20/solid'
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
import Select from '@components/forms/Select'
import { floorToDecimal } from 'utils/numbers'
import { withValueLimit } from './MarketSwapForm'
import SellTokenInput from './SellTokenInput'
import BuyTokenInput from './BuyTokenInput'
import { notify } from 'utils/notifications'
import * as sentry from '@sentry/nextjs'
import { isMangoError } from 'types'
import Button from '@components/shared/Button'
import { useWallet } from '@solana/wallet-adapter-react'
import Loading from '@components/shared/Loading'

type LimitSwapFormProps = {
  setShowTokenSelect: Dispatch<SetStateAction<'input' | 'output' | undefined>>
}

const ORDER_TYPES = ['trade:limit', 'trade:stop-market', 'trade:stop-limit']

const set = mangoStore.getState().set

const LimitSwapForm = ({ setShowTokenSelect }: LimitSwapFormProps) => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  const { connected } = useWallet()
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [orderType, setOrderType] = useState(ORDER_TYPES[0])
  const [triggerPrice, setTriggerPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [swapFormSizeUi] = useLocalStorageState(SIZE_INPUT_UI_KEY, 'slider')

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

  const amountOutAsDecimal: Decimal | null = useMemo(() => {
    return Number(amountOutFormValue)
      ? new Decimal(amountOutFormValue)
      : new Decimal(0)
  }, [amountOutFormValue])

  const [baseBank, quoteBank] = useMemo(() => {
    if (inputBank && inputBank.name === 'USDC') {
      return [outputBank, inputBank]
    } else if (outputBank && outputBank.name === 'USDC') {
      return [inputBank, outputBank]
    } else if (inputBank && inputBank.name === 'SOL') {
      return [outputBank, inputBank]
    } else return [inputBank, outputBank]
  }, [inputBank, outputBank])

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

  const setLimitPrice = useCallback((price: string) => {
    set((s) => {
      s.swap.limitPrice = price
    })
  }, [])

  useEffect(() => {
    if (!baseBank || !quoteBank) return
    const initialLimitPrice = baseBank.uiPrice / quoteBank.uiPrice
    if (!limitPrice) {
      set((s) => {
        s.swap.limitPrice = initialLimitPrice.toString()
      })
    }
  }, [baseBank, limitPrice, quoteBank])

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
      setAmountInFormValue(e.value)
      if (parseFloat(e.value) > 0 && limitPrice && outputBank) {
        const amount =
          outputBank.name === quoteBank?.name
            ? floorToDecimal(
                parseFloat(e.value) * parseFloat(limitPrice),
                outputBank.mintDecimals,
              )
            : floorToDecimal(
                parseFloat(e.value) / parseFloat(limitPrice),
                outputBank.mintDecimals,
              )
        setAmountOutFormValue(amount.toString())
      }
    },
    [
      limitPrice,
      outputBank,
      quoteBank,
      setAmountInFormValue,
      setAmountOutFormValue,
    ],
  )

  const handleAmountOutChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setAmountOutFormValue(e.value)
      if (parseFloat(e.value) > 0 && limitPrice && inputBank) {
        const amount =
          outputBank?.name === quoteBank?.name
            ? floorToDecimal(
                parseFloat(e.value) / parseFloat(limitPrice),
                inputBank.mintDecimals,
              )
            : floorToDecimal(
                parseFloat(e.value) * parseFloat(limitPrice),
                inputBank.mintDecimals,
              )
        setAmountInFormValue(amount.toString())
      }
    },
    [
      inputBank,
      outputBank,
      limitPrice,
      setAmountInFormValue,
      setAmountOutFormValue,
    ],
  )

  const handleAmountInUi = useCallback(
    (amountIn: string) => {
      setAmountInFormValue(amountIn)
      if (limitPrice && outputBank) {
        const amount = floorToDecimal(
          parseFloat(amountIn) / parseFloat(limitPrice),
          outputBank.mintDecimals,
        )
        setAmountOutFormValue(amount.toString())
      }
    },
    [limitPrice, outputBank, setAmountInFormValue, setAmountOutFormValue],
  )

  const handleLimitPrice = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setLimitPrice(e.value)
      if (
        parseFloat(e.value) > 0 &&
        parseFloat(amountInFormValue) > 0 &&
        outputBank
      ) {
        const amount = floorToDecimal(
          parseFloat(amountInFormValue) * parseFloat(e.value),
          outputBank.mintDecimals,
        )
        setAmountOutFormValue(amount.toString())
      }
    },
    [amountInFormValue, outputBank, setLimitPrice],
  )

  const handleTriggerPrice = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setTriggerPrice(e.value)
    },
    [setTriggerPrice],
  )

  const handleLimitSwap = useCallback(async () => {
    try {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const inputBank = mangoStore.getState().swap.inputBank
      const outputBank = mangoStore.getState().swap.outputBank

      if (
        !mangoAccount ||
        !group ||
        !inputBank ||
        !outputBank ||
        (!triggerPrice && orderType !== 'trade:limit') ||
        (!limitPrice && orderType !== 'trade:stop-market')
      )
        return
      setSubmitting(true)

      const orderPrice =
        orderType === 'trade:limit'
          ? parseFloat(limitPrice!)
          : parseFloat(triggerPrice)

      const stopLimitPrice =
        orderType !== 'trade:stop-market' ? parseFloat(limitPrice!) : 0

      try {
        const tx = await client.tokenConditionalSwapStopLoss(
          group,
          mangoAccount,
          inputBank.mint,
          orderPrice,
          outputBank.mint,
          stopLimitPrice,
          amountInAsDecimal.toNumber(),
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
  }, [orderType, limitPrice, triggerPrice, amountInAsDecimal])

  const handleSwitchTokens = useCallback(() => {
    if (amountInAsDecimal?.gt(0) && limitPrice) {
      const amountOut =
        outputBank?.name !== quoteBank?.name
          ? amountInAsDecimal.mul(limitPrice)
          : amountInAsDecimal.div(limitPrice)
      setAmountOutFormValue(amountOut.toString())
    }
    set((s) => {
      s.swap.inputBank = outputBank
      s.swap.outputBank = inputBank
      // s.swap.limitPrice = ''
    })
    setAnimateSwitchArrow(
      (prevanimateSwitchArrow) => prevanimateSwitchArrow + 1,
    )
  }, [
    setAmountInFormValue,
    amountOutAsDecimal,
    amountInAsDecimal,
    limitPrice,
    inputBank,
    outputBank,
    quoteBank,
  ])

  const limitOrderDisabled =
    !connected || !amountInFormValue || !amountOutFormValue

  return (
    <>
      <SellTokenInput
        className="rounded-b-none"
        handleAmountInChange={handleAmountInChange}
        setShowTokenSelect={setShowTokenSelect}
        setAmountInFormValue={setAmountInFormValue}
      />
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
            buttonClassName="ring-transparent rounded-t-lg rounded-b-lg focus:outline-none md:hover:bg-th-bkg-1 md:hover:ring-transparent focus-visible:bg-th-bkg-3"
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
            <p className="mb-2 text-th-fgd-2">{t('trade:trigger-price')}</p>
            <NumberFormat
              inputMode="decimal"
              thousandSeparator=","
              allowNegative={false}
              isNumericString={true}
              decimalScale={outputBank?.mintDecimals || 6}
              name="triggerPrice"
              id="triggerPrice"
              className="h-10 w-full rounded-lg bg-th-input-bkg p-3 text-right font-mono text-sm text-th-fgd-1 focus:outline-none md:hover:bg-th-bkg-1"
              placeholder="0.00"
              value={triggerPrice}
              onValueChange={handleTriggerPrice}
              isAllowed={withValueLimit}
            />
          </div>
        ) : null}
        {orderType !== 'trade:stop-market' ? (
          <div className="col-span-1">
            <p className="mb-2 text-th-fgd-2">
              {t('trade:limit-price')}
              <span className="text-xs text-th-fgd-3">
                {' '}
                ({quoteBank?.name})
              </span>
            </p>
            <NumberFormat
              inputMode="decimal"
              thousandSeparator=","
              allowNegative={false}
              isNumericString={true}
              decimalScale={outputBank?.mintDecimals || 6}
              name="limitPrice"
              id="limitPrice"
              className="h-10 w-full rounded-lg bg-th-input-bkg p-3 text-right font-mono text-sm text-th-fgd-1 focus:outline-none md:hover:bg-th-bkg-1"
              placeholder="0.00"
              value={limitPrice}
              onValueChange={handleLimitPrice}
              isAllowed={withValueLimit}
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
        handleAmountOutChange={handleAmountOutChange}
        setShowTokenSelect={setShowTokenSelect}
        setAmountOutFormValue={setAmountOutFormValue}
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
        onClick={handleLimitSwap}
        className="mt-6 mb-4 flex w-full items-center justify-center text-base"
        disabled={limitOrderDisabled}
        size="large"
      >
        {submitting ? <Loading /> : t('swap:place-limit-order')}
      </Button>
    </>
  )
}

export default LimitSwapForm
