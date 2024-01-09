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
import { SIZE_INPUT_UI_KEY } from '../../utils/constants'
import { useWallet } from '@solana/wallet-adapter-react'
import { JupiterV6RouteInfo } from 'types/jupiter'
import useLocalStorageState from 'hooks/useLocalStorageState'
import SwapSlider from './SwapSlider'
import PercentageSelectButtons from './PercentageSelectButtons'
import BuyTokenInput from './BuyTokenInput'
import SellTokenInput from './SellTokenInput'
import SwapReviewRouteInfo from './SwapReviewRouteInfo'
import useQuoteRoutes from './useQuoteRoutes'
import { useTokenMax } from './useTokenMax'
import useMangoAccount from 'hooks/useMangoAccount'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { SwapFormTokenListType } from './SwapFormTokenList'
import SwapFormSubmitButton from './SwapFormSubmitButton'
import { debounce } from 'lodash'

dayjs.extend(relativeTime)

type MarketSwapFormProps = {
  setShowTokenSelect: Dispatch<SetStateAction<SwapFormTokenListType>>
  onSuccess?: () => void
}

const MAX_DIGITS = 11
export const withValueLimit = (values: NumberFormatValues): boolean => {
  return values.floatValue
    ? values.floatValue.toFixed(0).length <= MAX_DIGITS
    : true
}

export const NUMBER_FORMAT_CLASSNAMES =
  'w-full rounded-r-lg h-[56px] box-border pb-4 border-l border-th-bkg-2 bg-th-input-bkg px-3 text-right font-mono text-xl text-th-fgd-1 focus:outline-none md:hover:bg-th-bkg-1'

const MarketSwapForm = ({
  setShowTokenSelect,
  onSuccess,
}: MarketSwapFormProps) => {
  //initial state is undefined null is returned on error
  const [selectedRoute, setSelectedRoute] =
    useState<JupiterV6RouteInfo | null>()
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [swapFormSizeUi] = useLocalStorageState(SIZE_INPUT_UI_KEY, 'slider')
  const {
    margin: useMargin,
    slippage,
    inputBank,
    outputBank,
    amountIn: amountInFormValue,
    amountOut: amountOutFormValue,
    swapMode,
  } = mangoStore((s) => s.swap)
  const set = mangoStore((s) => s.set)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)
  const { connected, publicKey } = useWallet()
  const { mangoAccount } = useMangoAccount()
  const quoteAmount =
    swapMode === 'ExactIn' ? amountInFormValue : amountOutFormValue

  const {
    bestRoute,
    isFetching: fetchingRoute,
    refetch: refetchRoute,
  } = useQuoteRoutes({
    inputMint: inputBank?.mint.toString(),
    outputMint: outputBank?.mint.toString(),
    amount: quoteAmount,
    slippage,
    swapMode,
    wallet: publicKey?.toBase58(),
    mangoAccount,
    enabled: () =>
      !!(
        inputBank?.mint &&
        outputBank?.mint &&
        quoteAmount &&
        !isDraggingSlider
      ),
  })

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
    [set],
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
    [set],
  )

  const handleAmountInChange = useCallback(
    debounce((e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setAmountInFormValue(e.value)
      set((s) => {
        s.swap.amountOut = ''
      })
      if (swapMode === 'ExactOut') {
        set((s) => {
          s.swap.swapMode = 'ExactIn'
        })
      }
    }, 500),
    [outputBank, set, setAmountInFormValue, swapMode],
  )

  const handleAmountOutChange = useCallback(
    debounce((e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      setAmountOutFormValue(e.value)
      set((s) => {
        s.swap.amountIn = ''
      })
      if (swapMode === 'ExactIn') {
        set((s) => {
          s.swap.swapMode = 'ExactOut'
        })
      }
    }, 500),
    [set, setAmountOutFormValue, swapMode],
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

  const handleSliderChange = useCallback(
    (amountIn: string) => {
      setAmountInFormValue(amountIn, true)
      set((s) => {
        s.swap.amountOut = ''
      })
    },
    [Set, setAmountInFormValue],
  )

  const handleMax = useCallback(
    (amountIn: string) => {
      setAmountInFormValue(amountIn, true)
      set((s) => {
        s.swap.amountOut = ''
      })
    },
    [set, setAmountInFormValue],
  )

  const handleRepay = useCallback(
    (amountOut: string) => {
      setAmountOutFormValue(amountOut, true)
      set((s) => {
        s.swap.amountIn = ''
      })
    },
    [set, setAmountInFormValue],
  )

  /* 
    Once a route is returned from the Jupiter API, use the inAmount or outAmount
    depending on the swapMode and set those values in state
  */
  useEffect(() => {
    if (typeof bestRoute !== 'undefined') {
      setSelectedRoute(bestRoute)

      if (inputBank && swapMode === 'ExactOut' && bestRoute?.inAmount) {
        const inAmount = new Decimal(bestRoute.inAmount)
          .div(10 ** inputBank.mintDecimals)
          .toString()
        setAmountInFormValue(inAmount)
      } else if (outputBank && swapMode === 'ExactIn' && bestRoute?.outAmount) {
        const outAmount = new Decimal(bestRoute.outAmount)
          .div(10 ** outputBank.mintDecimals)
          .toString()
        setAmountOutFormValue(outAmount)
      }
    }
  }, [bestRoute, swapMode, inputBank, outputBank])

  const handleSwitchTokens = useCallback(() => {
    if (amountInAsDecimal?.gt(0) && amountOutAsDecimal.gte(0)) {
      setAmountInFormValue(amountOutAsDecimal.toString())
    }
    const inputBank = mangoStore.getState().swap.inputBank
    const outputBank = mangoStore.getState().swap.outputBank
    set((s) => {
      s.swap.inputBank = outputBank
      s.swap.outputBank = inputBank
      s.swap.amountIn = ''
      s.swap.amountOut = ''
    })
    setAnimateSwitchArrow(
      (prevanimateSwitchArrow) => prevanimateSwitchArrow + 1,
    )
  }, [amountInAsDecimal, amountOutAsDecimal, set, setAmountInFormValue])

  const loadingExactIn: boolean = useMemo(() => {
    return (
      (!!(amountInAsDecimal.toNumber() || amountOutAsDecimal.toNumber()) &&
        connected &&
        typeof selectedRoute === 'undefined') ||
      !!(
        swapMode === 'ExactIn' &&
        amountInAsDecimal.toNumber() &&
        !amountOutAsDecimal.toNumber()
      )
    )
  }, [
    amountInAsDecimal,
    amountOutAsDecimal,
    connected,
    selectedRoute,
    swapMode,
  ])

  const loadingExactOut: boolean = useMemo(() => {
    return (
      (!!(amountInAsDecimal.toNumber() || amountOutAsDecimal.toNumber()) &&
        connected &&
        typeof selectedRoute === 'undefined') ||
      !!(
        swapMode === 'ExactOut' &&
        amountOutAsDecimal.toNumber() &&
        !amountInAsDecimal.toNumber()
      )
    )
  }, [
    amountInAsDecimal,
    amountOutAsDecimal,
    connected,
    selectedRoute,
    swapMode,
  ])

  return (
    <>
      <SwapReviewRouteInfo
        amountIn={amountInAsDecimal}
        loadingRoute={fetchingRoute}
        onClose={() => setShowConfirm(false)}
        onSuccess={onSuccess}
        refetchRoute={refetchRoute}
        routes={bestRoute ? [bestRoute] : undefined}
        selectedRoute={selectedRoute}
        setSelectedRoute={setSelectedRoute}
        show={showConfirm}
        slippage={slippage}
      />
      <SellTokenInput
        handleAmountInChange={handleAmountInChange}
        setShowTokenSelect={setShowTokenSelect}
        handleMax={handleMax}
        loading={loadingExactOut}
      />
      <div className="rounded-b-xl bg-th-bkg-2 p-3 pt-0">
        {swapFormSizeUi === 'slider' ? (
          <SwapSlider
            useMargin={useMargin}
            amount={amountInAsDecimal.toNumber()}
            onChange={(v) => handleSliderChange(v)}
            step={1 / 10 ** (inputBank?.mintDecimals || 6)}
            maxAmount={useTokenMax}
            handleStartDrag={handleSliderDrag}
            handleEndDrag={handleSliderDragEnd}
          />
        ) : (
          <div className="-mt-2">
            <PercentageSelectButtons
              amountIn={amountInAsDecimal.toString()}
              setAmountIn={(v) => handleSliderChange(v)}
              useMargin={useMargin}
            />
          </div>
        )}
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
        loading={loadingExactIn}
        setShowTokenSelect={setShowTokenSelect}
        handleRepay={handleRepay}
      />
      <SwapFormSubmitButton
        loadingSwapDetails={loadingExactIn || loadingExactOut}
        selectedRoute={selectedRoute}
        setShowConfirm={setShowConfirm}
        amountIn={amountInAsDecimal}
        amountOut={selectedRoute ? amountOutAsDecimal.toNumber() : undefined}
      />
    </>
  )
}

export default MarketSwapForm
