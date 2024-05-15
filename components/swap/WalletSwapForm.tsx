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
import { DEFAULT_PERCENTAGE_VALUES } from './PercentageSelectButtons'
import BuyTokenInput from './BuyTokenInput'
import SwapReviewRouteInfo from './SwapReviewRouteInfo'
import useQuoteRoutes from './useQuoteRoutes'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { floorToDecimal } from 'utils/numbers'
import { SwapFormTokenListType } from './SwapFormTokenList'
import WalletSellTokenInput from './WalletSellTokenInput'
import { walletBalanceForToken } from '@components/DepositForm'
import WalletSwapSlider from './WalletSwapSlider'
import ButtonGroup from '@components/forms/ButtonGroup'
import SwapFormSubmitButton from './SwapFormSubmitButton'
import { debounce } from 'lodash'

dayjs.extend(relativeTime)

type WalletSwapFormProps = {
  setShowTokenSelect: Dispatch<SetStateAction<SwapFormTokenListType>>
}

const set = mangoStore.getState().set

const WalletSwapForm = ({ setShowTokenSelect }: WalletSwapFormProps) => {
  //initial state is undefined null is returned on error
  const [selectedRoute, setSelectedRoute] =
    useState<JupiterV6RouteInfo | null>()
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)
  const [swapFormSizeUi] = useLocalStorageState(SIZE_INPUT_UI_KEY, 'slider')
  const {
    slippage,
    inputBank,
    outputBank,
    amountIn: amountInFormValue,
    amountOut: amountOutFormValue,
    swapMode,
  } = mangoStore((s) => s.swap)
  const { connected, publicKey } = useWallet()
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
    mangoAccount: undefined,
    mode: 'JUPITER',
    enabled: () =>
      !!(
        inputBank?.mint &&
        outputBank?.mint &&
        quoteAmount &&
        !isDraggingSlider
      ),
  })

  const walletTokens = mangoStore((s) => s.wallet.tokens)

  const [walletMax, inputDecimals] = useMemo(() => {
    if (!inputBank) return ['0', 6]
    const walletBalance = walletBalanceForToken(
      walletTokens,
      inputBank.name,
      true,
    )
    const max = floorToDecimal(
      walletBalance.maxAmount,
      walletBalance.maxDecimals,
    ).toFixed()
    return [max, walletBalance.maxDecimals]
  }, [walletTokens, inputBank])

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
    [outputBank, setAmountInFormValue, swapMode],
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
    [swapMode, setAmountOutFormValue],
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
    [setAmountInFormValue],
  )

  const handleMax = useCallback(
    (amountIn: string) => {
      setAmountInFormValue(amountIn, true)
      set((s) => {
        s.swap.amountOut = ''
      })
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
      s.swap.amountIn = ''
      s.swap.amountOut = ''
    })
    setAnimateSwitchArrow(
      (prevanimateSwitchArrow) => prevanimateSwitchArrow + 1,
    )
  }, [setAmountInFormValue, amountOutAsDecimal, amountInAsDecimal])

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

  const handleSizePercentage = (percentage: string) => {
    setSizePercentage(percentage)
    const walletMaxDecimal = new Decimal(walletMax)
    if (walletMaxDecimal.gt(0)) {
      let amount = walletMaxDecimal.mul(percentage).div(100)
      if (percentage !== '100') {
        amount = floorToDecimal(amount, inputDecimals)
      }
      setAmountInFormValue(amount.toFixed(), true)
      set((s) => {
        s.swap.amountOut = ''
      })
    } else {
      setAmountInFormValue('0')
    }
  }

  return (
    <>
      <SwapReviewRouteInfo
        amountIn={amountInAsDecimal}
        loadingRoute={fetchingRoute}
        isWalletSwap
        onClose={() => setShowConfirm(false)}
        refetchRoute={refetchRoute}
        routes={bestRoute ? [bestRoute] : undefined}
        selectedRoute={selectedRoute}
        setSelectedRoute={setSelectedRoute}
        show={showConfirm}
        slippage={slippage}
      />
      <WalletSellTokenInput
        handleAmountInChange={handleAmountInChange}
        setShowTokenSelect={setShowTokenSelect}
        handleMax={handleMax}
        max={walletMax}
        loading={loadingExactOut}
      />
      <div className="rounded-b-xl bg-th-bkg-2 p-3 pt-0">
        {swapFormSizeUi === 'slider' ? (
          <WalletSwapSlider
            amount={amountInAsDecimal.toNumber()}
            onChange={(v) => handleSliderChange(v)}
            step={1 / 10 ** (inputBank?.mintDecimals || 6)}
            maxAmount={parseFloat(walletMax)}
            handleStartDrag={handleSliderDrag}
            handleEndDrag={handleSliderDragEnd}
          />
        ) : (
          <div className="col-span-2">
            <ButtonGroup
              activeValue={sizePercentage}
              onChange={(p) => handleSizePercentage(p)}
              values={DEFAULT_PERCENTAGE_VALUES}
              unit="%"
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
      />
      <SwapFormSubmitButton
        loadingSwapDetails={loadingExactIn || loadingExactOut}
        selectedRoute={selectedRoute}
        setShowConfirm={setShowConfirm}
        amountIn={amountInAsDecimal}
        amountOut={selectedRoute ? amountOutAsDecimal.toNumber() : undefined}
        walletSwap
      />
    </>
  )
}

export default WalletSwapForm
