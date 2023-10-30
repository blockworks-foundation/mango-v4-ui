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
import { MANGO_MINT, SIZE_INPUT_UI_KEY, USDC_MINT } from '../../utils/constants'
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

const set = mangoStore.getState().set

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
  const [debouncedAmountIn] = useDebounce(amountInFormValue, 300)
  const [debouncedAmountOut] = useDebounce(amountOutFormValue, 300)
  const { connected, publicKey } = useWallet()
  const { mangoAccount } = useMangoAccount()
  const { bestRoute } = useQuoteRoutes({
    inputMint: inputBank?.mint.toString() || USDC_MINT,
    outputMint: outputBank?.mint.toString() || MANGO_MINT,
    amount: swapMode === 'ExactIn' ? debouncedAmountIn : debouncedAmountOut,
    slippage,
    swapMode,
    wallet: publicKey?.toBase58(),
    mangoAccount,
  })

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
      <SwapReviewRouteInfo
        amountIn={amountInAsDecimal}
        onClose={() => setShowConfirm(false)}
        onSuccess={onSuccess}
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
      />
      <div className="rounded-b-xl bg-th-bkg-2 p-3 pt-0">
        {swapFormSizeUi === 'slider' ? (
          <SwapSlider
            useMargin={useMargin}
            amount={amountInAsDecimal.toNumber()}
            onChange={(v) => setAmountInFormValue(v, true)}
            step={1 / 10 ** (inputBank?.mintDecimals || 6)}
            maxAmount={useTokenMax}
          />
        ) : (
          <div className="-mt-2">
            <PercentageSelectButtons
              amountIn={amountInAsDecimal.toString()}
              setAmountIn={(v) => setAmountInFormValue(v, true)}
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
        loading={loadingSwapDetails}
        setShowTokenSelect={setShowTokenSelect}
        handleRepay={handleRepay}
      />
      <SwapFormSubmitButton
        loadingSwapDetails={loadingSwapDetails}
        selectedRoute={selectedRoute}
        setShowConfirm={setShowConfirm}
        amountIn={amountInAsDecimal}
        amountOut={selectedRoute ? amountOutAsDecimal.toNumber() : undefined}
      />
    </>
  )
}

export default MarketSwapForm
