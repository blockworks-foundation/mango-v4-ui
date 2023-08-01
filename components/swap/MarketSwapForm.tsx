import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from 'react'
import { ArrowDownIcon } from '@heroicons/react/20/solid'
import { NumberFormatValues, SourceInfo } from 'react-number-format'
import Decimal from 'decimal.js'
import mangoStore from '@store/mangoStore'
import useDebounce from '../shared/useDebounce'
import { SIZE_INPUT_UI_KEY } from '../../utils/constants'
import { useWallet } from '@solana/wallet-adapter-react'
import { RouteInfo } from 'types/jupiter'
import useLocalStorageState from 'hooks/useLocalStorageState'
import SwapSlider from './SwapSlider'
import PercentageSelectButtons from './PercentageSelectButtons'
import BuyTokenInput from './BuyTokenInput'
import SellTokenInput from './SellTokenInput'

type MarketSwapFormProps = {
  bestRoute: RouteInfo | undefined | null
  selectedRoute: RouteInfo | undefined | null
  setSelectedRoute: Dispatch<SetStateAction<RouteInfo | undefined | null>>
  setShowTokenSelect: Dispatch<SetStateAction<'input' | 'output' | undefined>>
}

const MAX_DIGITS = 11
export const withValueLimit = (values: NumberFormatValues): boolean => {
  return values.floatValue
    ? values.floatValue.toFixed(0).length <= MAX_DIGITS
    : true
}

export const NUMBER_FORMAT_CLASSNAMES =
  'w-full rounded-r-lg h-[56px] box-border pb-4 border-l border-th-bkg-2 bg-th-input-bkg px-3 text-right font-mono text-xl text-th-fgd-1 focus:outline-none md:hover:bg-th-bkg-1'

const set = mangoStore.getState().set

const MarketSwapForm = ({
  bestRoute,
  selectedRoute,
  setSelectedRoute,
  setShowTokenSelect,
}: MarketSwapFormProps) => {
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [swapFormSizeUi] = useLocalStorageState(SIZE_INPUT_UI_KEY, 'slider')

  const {
    margin: useMargin,
    inputBank,
    outputBank,
    amountIn: amountInFormValue,
    amountOut: amountOutFormValue,
    swapMode,
  } = mangoStore((s) => s.swap)
  const [debouncedAmountIn] = useDebounce(amountInFormValue, 300)
  const [debouncedAmountOut] = useDebounce(amountOutFormValue, 300)
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
    [],
  )

  const setAmountOutFormValue = useCallback(
    (amountOut: string, setSwapMode?: boolean) => {
      set((s) => {
        s.swap.amountOut = amountOut
        if (!parseFloat(amountOut)) {
          s.swap.amountIn = ''
        }
        if (setSwapMode) {
          s.swap.swapMode = 'ExactOut'
        }
      })
    },
    [],
  )

  const handleAmountInChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setAmountInFormValue(e.value)
      if (swapMode === 'ExactOut') {
        set((s) => {
          s.swap.swapMode = 'ExactIn'
        })
      }
    },
    [outputBank, setAmountInFormValue, swapMode],
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
    [swapMode, setAmountOutFormValue],
  )

  const handleMax = useCallback(
    (amountIn: string) => {
      setAmountInFormValue(amountIn, true)
    },
    [setAmountInFormValue],
  )

  const handleRepay = useCallback(
    (amountOut: string) => {
      setAmountOutFormValue(amountOut, true)
    },
    [setAmountInFormValue],
  )

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
      (prevanimateSwitchArrow) => prevanimateSwitchArrow + 1,
    )
  }, [setAmountInFormValue, amountOutAsDecimal, amountInAsDecimal])

  const loadingSwapDetails: boolean = useMemo(() => {
    return (
      !!(amountInAsDecimal.toNumber() || amountOutAsDecimal.toNumber()) &&
      connected &&
      typeof selectedRoute === 'undefined'
    )
  }, [amountInAsDecimal, amountOutAsDecimal, connected, selectedRoute])

  return (
    <>
      <SellTokenInput
        handleAmountInChange={handleAmountInChange}
        setShowTokenSelect={setShowTokenSelect}
        handleMax={handleMax}
      />
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
        loading={loadingSwapDetails}
        setShowTokenSelect={setShowTokenSelect}
        handleRepay={handleRepay}
      />
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
    </>
  )
}

export default MarketSwapForm
