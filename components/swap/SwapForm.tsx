import { useState, useCallback, useMemo, useEffect } from 'react'
import { PublicKey } from '@solana/web3.js'
import {
  Cog8ToothIcon,
  ExclamationCircleIcon,
  LinkIcon,
} from '@heroicons/react/20/solid'
import Decimal from 'decimal.js'
import mangoStore from '@store/mangoStore'
import ContentBox from '../shared/ContentBox'
import SwapReviewRouteInfo from './SwapReviewRouteInfo'
import useDebounce from '../shared/useDebounce'
import { useTranslation } from 'next-i18next'
import SwapFormTokenList from './SwapFormTokenList'
import { Transition } from '@headlessui/react'
import Button, { IconButton, LinkButton } from '../shared/Button'
import Loading from '../shared/Loading'
import { EnterBottomExitBottom } from '../shared/Transitions'
import useQuoteRoutes from './useQuoteRoutes'
import { HealthType } from '@blockworks-foundation/mango-v4'
import { MANGO_MINT, SWAP_MARGIN_KEY, USDC_MINT } from '../../utils/constants'
import { useTokenMax } from './useTokenMax'
import HealthImpact from '@components/shared/HealthImpact'
import { useWallet } from '@solana/wallet-adapter-react'
import useMangoAccount from 'hooks/useMangoAccount'
import { RouteInfo } from 'types/jupiter'
import useMangoGroup from 'hooks/useMangoGroup'
import TokenVaultWarnings from '@components/shared/TokenVaultWarnings'
import useIpAddress from 'hooks/useIpAddress'
import SwapSettings from './SwapSettings'
import InlineNotification from '@components/shared/InlineNotification'
import Tooltip from '@components/shared/Tooltip'
import TabUnderline from '@components/shared/TabUnderline'
import MarketSwapForm from './MarketSwapForm'
import LimitSwapForm from './LimitSwapForm'
import Switch from '@components/forms/Switch'
import useLocalStorageState from 'hooks/useLocalStorageState'

const set = mangoStore.getState().set

const SwapForm = () => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  //initial state is undefined null is returned on error
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>()
  const [showTokenSelect, setShowTokenSelect] = useState<'input' | 'output'>()
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [swapOrLimit, setSwapOrLimit] = useState('swap')
  const { group } = useMangoGroup()
  const [, setSavedSwapMargin] = useLocalStorageState<boolean>(
    SWAP_MARGIN_KEY,
    true,
  )
  const { ipAllowed, ipCountry } = useIpAddress()

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
  const { mangoAccount } = useMangoAccount()
  const { connected, publicKey } = useWallet()

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

  const { bestRoute, routes } = useQuoteRoutes({
    inputMint: inputBank?.mint.toString() || USDC_MINT,
    outputMint: outputBank?.mint.toString() || MANGO_MINT,
    amount: swapMode === 'ExactIn' ? debouncedAmountIn : debouncedAmountOut,
    slippage,
    swapMode,
    wallet: publicKey?.toBase58(),
  })

  const handleTokenInSelect = useCallback((mintAddress: string) => {
    const group = mangoStore.getState().group
    if (group) {
      const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
      set((s) => {
        s.swap.inputBank = bank
        s.swap.limitPrice = ''
      })
    }
    setShowTokenSelect(undefined)
  }, [])

  const handleTokenOutSelect = useCallback((mintAddress: string) => {
    const group = mangoStore.getState().group
    if (group) {
      const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
      set((s) => {
        s.swap.outputBank = bank
        s.swap.limitPrice = ''
      })
    }
    setShowTokenSelect(undefined)
  }, [])

  const maintProjectedHealth = useMemo(() => {
    const group = mangoStore.getState().group
    if (
      !inputBank ||
      !mangoAccount ||
      !outputBank ||
      !amountOutAsDecimal ||
      !group
    )
      return 0

    const simulatedHealthRatio =
      mangoAccount.simHealthRatioWithTokenPositionUiChanges(
        group,
        [
          {
            mintPk: inputBank.mint,
            uiTokenAmount: amountInAsDecimal.toNumber() * -1,
          },
          {
            mintPk: outputBank.mint,
            uiTokenAmount: amountOutAsDecimal.toNumber(),
          },
        ],
        HealthType.maint,
      )
    return simulatedHealthRatio > 100
      ? 100
      : simulatedHealthRatio < 0
      ? 0
      : Math.trunc(simulatedHealthRatio)
  }, [
    mangoAccount,
    inputBank,
    outputBank,
    amountInAsDecimal,
    amountOutAsDecimal,
  ])

  const loadingSwapDetails: boolean = useMemo(() => {
    return (
      !!(amountInAsDecimal.toNumber() || amountOutAsDecimal.toNumber()) &&
      swapOrLimit === 'swap' &&
      connected &&
      typeof selectedRoute === 'undefined'
    )
  }, [
    amountInAsDecimal,
    amountOutAsDecimal,
    connected,
    selectedRoute,
    swapOrLimit,
  ])

  const handleSwapOrLimit = useCallback(
    (orderType: string) => {
      setSwapOrLimit(orderType)
    },
    [outputBank, set, setSwapOrLimit],
  )

  const handleSetMargin = () => {
    set((s) => {
      s.swap.margin = !s.swap.margin
    })
  }

  useEffect(() => {
    setSavedSwapMargin(useMargin)
  }, [useMargin])

  return (
    <ContentBox
      hidePadding
      className="relative overflow-hidden border-x-0 bg-th-bkg-1 md:border-l md:border-r-0 md:border-t-0 md:border-b-0"
    >
      <div>
        <Transition
          className="absolute top-0 right-0 z-10 h-full w-full bg-th-bkg-1 pb-0"
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
        <EnterBottomExitBottom
          className="thin-scroll absolute bottom-0 left-0 z-10 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
          show={!!showTokenSelect}
        >
          <SwapFormTokenList
            onClose={() => setShowTokenSelect(undefined)}
            onTokenSelect={
              showTokenSelect === 'input'
                ? handleTokenInSelect
                : handleTokenOutSelect
            }
            type={showTokenSelect}
            useMargin={useMargin}
          />
        </EnterBottomExitBottom>
        <EnterBottomExitBottom
          className="thin-scroll absolute bottom-0 left-0 z-10 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
          show={showSettings}
        >
          <SwapSettings onClose={() => setShowSettings(false)} />
        </EnterBottomExitBottom>
        <div className="relative p-6">
          <div className="mb-6">
            <TabUnderline
              activeValue={swapOrLimit}
              values={['swap', 'trade:limit']}
              onChange={(v) => handleSwapOrLimit(v)}
            />
          </div>
          <div className="absolute right-4 top-4">
            <IconButton
              className="text-th-fgd-3"
              hideBg
              onClick={() => setShowSettings(true)}
            >
              <Cog8ToothIcon className="h-5 w-5" />
            </IconButton>
          </div>
          {swapOrLimit === 'swap' ? (
            <MarketSwapForm
              bestRoute={bestRoute}
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
              setShowTokenSelect={setShowTokenSelect}
            />
          ) : (
            <LimitSwapForm setShowTokenSelect={setShowTokenSelect} />
          )}
          {ipAllowed ? (
            swapOrLimit === 'swap' ? (
              <SwapFormSubmitButton
                loadingSwapDetails={loadingSwapDetails}
                useMargin={useMargin}
                selectedRoute={selectedRoute}
                setShowConfirm={setShowConfirm}
                amountIn={amountInAsDecimal}
                inputSymbol={inputBank?.name}
                amountOut={
                  selectedRoute ? amountOutAsDecimal.toNumber() : undefined
                }
              />
            ) : null
          ) : (
            <Button
              disabled
              className="mt-6 mb-4 w-full leading-tight"
              size="large"
            >
              {t('country-not-allowed', {
                country: ipCountry ? `(${ipCountry})` : '',
              })}
            </Button>
          )}
          {group && inputBank ? (
            <TokenVaultWarnings bank={inputBank} type="swap" />
          ) : null}
          {inputBank &&
          inputBank.areBorrowsReduceOnly() &&
          inputBank.areDepositsReduceOnly() ? (
            <div className="pb-4">
              <InlineNotification
                type="warning"
                desc={t('swap:input-reduce-only-warning', {
                  symbol: inputBank.name,
                })}
              />
            </div>
          ) : null}
          {outputBank &&
          outputBank.areBorrowsReduceOnly() &&
          outputBank.areDepositsReduceOnly() ? (
            <div className="pb-4">
              <InlineNotification
                type="warning"
                desc={t('swap:output-reduce-only-warning', {
                  symbol: outputBank.name,
                })}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <div id="swap-step-four">
              <HealthImpact maintProjectedHealth={maintProjectedHealth} />
            </div>
            <div className="flex items-center justify-between">
              <Tooltip content={t('swap:tooltip-margin')}>
                <p className="tooltip-underline text-sm text-th-fgd-3">
                  {t('swap:margin')}
                </p>
              </Tooltip>
              <Switch
                className="text-th-fgd-3"
                checked={useMargin}
                onChange={handleSetMargin}
                small
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-th-fgd-3">{t('swap:max-slippage')}</p>
              <LinkButton
                className="text-right font-mono text-sm font-normal text-th-fgd-2 underline underline-offset-2 md:hover:no-underline"
                onClick={() => setShowSettings(true)}
              >
                {slippage}%
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </ContentBox>
  )
}

export default SwapForm

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
  const { connected, connect } = useWallet()
  const { amount: tokenMax, amountWithBorrow } = useTokenMax(useMargin)

  const showInsufficientBalance = useMargin
    ? amountWithBorrow.lt(amountIn)
    : tokenMax.lt(amountIn)

  const disabled =
    connected &&
    (!amountIn.toNumber() ||
      showInsufficientBalance ||
      !amountOut ||
      !selectedRoute)

  const onClick = connected ? () => setShowConfirm(true) : connect

  return (
    <>
      <Button
        onClick={onClick}
        className="mt-6 mb-4 flex w-full items-center justify-center text-base"
        disabled={disabled}
        size="large"
      >
        {connected ? (
          showInsufficientBalance ? (
            <div className="flex items-center">
              <ExclamationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0" />
              {t('swap:insufficient-balance', {
                symbol: inputSymbol,
              })}
            </div>
          ) : loadingSwapDetails ? (
            <Loading />
          ) : (
            <span>{t('swap:review-swap')}</span>
          )
        ) : (
          <div className="flex items-center">
            <LinkIcon className="mr-2 h-5 w-5" />
            {t('connect')}
          </div>
        )}
      </Button>
      {selectedRoute === null && amountIn.gt(0) ? (
        <div className="mb-4">
          <InlineNotification type="error" desc={t('swap:no-swap-found')} />
        </div>
      ) : null}
    </>
  )
}
