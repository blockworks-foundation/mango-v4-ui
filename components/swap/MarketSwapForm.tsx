import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from 'react'
import { ArrowDownIcon, ArrowDownTrayIcon } from '@heroicons/react/20/solid'
import { NumberFormatValues, SourceInfo } from 'react-number-format'
import Decimal from 'decimal.js'
import mangoStore from '@store/mangoStore'
import useDebounce from '../shared/useDebounce'
import { MANGO_MINT, SIZE_INPUT_UI_KEY, USDC_MINT } from '../../utils/constants'
import { useWallet } from '@solana/wallet-adapter-react'
import { RouteInfo } from 'types/jupiter'
import useLocalStorageState from 'hooks/useLocalStorageState'
import SwapSlider from './SwapSlider'
import PercentageSelectButtons from './PercentageSelectButtons'
import BuyTokenInput from './BuyTokenInput'
import SellTokenInput from './SellTokenInput'
import Button from '@components/shared/Button'
import { Transition } from '@headlessui/react'
import SwapReviewRouteInfo from './SwapReviewRouteInfo'
import useIpAddress from 'hooks/useIpAddress'
import { useTranslation } from 'react-i18next'
import useQuoteRoutes from './useQuoteRoutes'
import { useTokenMax } from './useTokenMax'
import Loading from '@components/shared/Loading'
import InlineNotification from '@components/shared/InlineNotification'
import useMangoAccount from 'hooks/useMangoAccount'
import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import DepositWithdrawModal from '@components/modals/DepositWithdrawModal'
import useMangoAccountAccounts from 'hooks/useMangoAccountAccounts'
import Link from 'next/link'
import SecondaryConnectButton from '@components/shared/SecondaryConnectButton'

type MarketSwapFormProps = {
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

const MarketSwapForm = ({ setShowTokenSelect }: MarketSwapFormProps) => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  //initial state is undefined null is returned on error
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>()
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
  const { bestRoute, routes } = useQuoteRoutes({
    inputMint: inputBank?.mint.toString() || USDC_MINT,
    outputMint: outputBank?.mint.toString() || MANGO_MINT,
    amount: swapMode === 'ExactIn' ? debouncedAmountIn : debouncedAmountOut,
    slippage,
    swapMode,
    wallet: publicKey?.toBase58(),
  })
  const { ipAllowed, ipCountry } = useIpAddress()

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
      <div>
        <Transition
          className="absolute right-0 top-0 z-10 h-full w-full bg-th-bkg-1 pb-0"
          show={showConfirm}
          enter="transition ease-in duration-300"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-out duration-300"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <SwapReviewRouteInfo
            onClose={() => setShowConfirm(false)}
            amountIn={amountInAsDecimal}
            slippage={slippage}
            routes={routes}
            selectedRoute={selectedRoute}
            setSelectedRoute={setSelectedRoute}
          />
        </Transition>
      </div>
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
      {ipAllowed ? (
        <SwapFormSubmitButton
          loadingSwapDetails={loadingSwapDetails}
          useMargin={useMargin}
          selectedRoute={selectedRoute}
          setShowConfirm={setShowConfirm}
          amountIn={amountInAsDecimal}
          inputSymbol={inputBank?.name}
          amountOut={selectedRoute ? amountOutAsDecimal.toNumber() : undefined}
        />
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
    </>
  )
}

export default MarketSwapForm

const SwapFormSubmitButton = ({
  amountIn,
  amountOut,
  inputSymbol,
  loadingSwapDetails,
  selectedRoute,
  setShowConfirm,
  useMargin,
}: {
  amountIn: Decimal
  amountOut: number | undefined
  inputSymbol: string | undefined
  loadingSwapDetails: boolean
  selectedRoute: RouteInfo | undefined | null
  setShowConfirm: (x: boolean) => void
  useMargin: boolean
}) => {
  const { t } = useTranslation('common')
  const { mangoAccountAddress } = useMangoAccount()
  const { connected } = useWallet()
  const { amount: tokenMax, amountWithBorrow } = useTokenMax(useMargin)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const { usedTokens, totalTokens } = useMangoAccountAccounts()
  const { inputBank, outputBank } = mangoStore((s) => s.swap)

  const tokenPositionsFull = useMemo(() => {
    if (!inputBank || !outputBank || !usedTokens.length || !totalTokens.length)
      return false
    const hasInputTokenPosition = usedTokens.find(
      (token) => token.tokenIndex === inputBank.tokenIndex,
    )
    const hasOutputTokenPosition = usedTokens.find(
      (token) => token.tokenIndex === outputBank.tokenIndex,
    )
    if (
      (hasInputTokenPosition && hasOutputTokenPosition) ||
      totalTokens.length - usedTokens.length >= 2
    ) {
      return false
    } else return true
  }, [inputBank, outputBank, usedTokens, totalTokens])

  const freeCollateral = useMemo(() => {
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    return group && mangoAccount
      ? toUiDecimalsForQuote(mangoAccount.getCollateralValue(group))
      : 0
  }, [mangoAccountAddress])

  const showInsufficientBalance = useMargin
    ? amountWithBorrow.lt(amountIn) || amountWithBorrow.eq(0)
    : tokenMax.lt(amountIn) || tokenMax.eq(0)

  const disabled =
    connected &&
    !showInsufficientBalance &&
    freeCollateral > 0 &&
    (!amountIn.toNumber() || !amountOut || !selectedRoute || tokenPositionsFull)

  const onClick =
    showInsufficientBalance || freeCollateral <= 0
      ? () => setShowDepositModal(true)
      : () => setShowConfirm(true)

  return (
    <>
      {connected ? (
        <Button
          onClick={onClick}
          className="mb-4 mt-6 flex w-full items-center justify-center text-base"
          disabled={disabled}
          size="large"
        >
          {showInsufficientBalance || freeCollateral <= 0 ? (
            <div className="flex items-center">
              <ArrowDownTrayIcon className="mr-2 h-5 w-5 flex-shrink-0" />
              {t('swap:deposit-funds')}
            </div>
          ) : loadingSwapDetails ? (
            <Loading />
          ) : (
            <span>{t('swap:review-swap')}</span>
          )}
        </Button>
      ) : (
        <SecondaryConnectButton
          className="mb-4 mt-6 flex w-full items-center justify-center"
          isLarge
        />
      )}
      {tokenPositionsFull ? (
        <div className="pb-4">
          <InlineNotification
            type="error"
            desc={
              <>
                {t('error-token-positions-full')}{' '}
                <Link href="/settings" shallow>
                  {t('manage')}
                </Link>
              </>
            }
          />
        </div>
      ) : null}
      {selectedRoute === null && amountIn.gt(0) ? (
        <div className="mb-4">
          <InlineNotification type="error" desc={t('swap:no-swap-found')} />
        </div>
      ) : null}
      {showDepositModal ? (
        <DepositWithdrawModal
          action="deposit"
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          token={freeCollateral > 0 ? inputSymbol : ''}
        />
      ) : null}
    </>
  )
}
