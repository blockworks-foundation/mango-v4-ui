import { useState, useCallback, useEffect, useMemo } from 'react'
import { PublicKey } from '@solana/web3.js'
import {
  ArrowDownIcon,
  ArrowRightIcon,
  Cog8ToothIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  HeartIcon,
  LinkIcon,
} from '@heroicons/react/20/solid'
import { RouteInfo } from '@jup-ag/core'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import Decimal from 'decimal.js'
import mangoStore from '@store/mangoStore'
import ContentBox from '../shared/ContentBox'
import JupiterRouteInfo from './JupiterRouteInfo'
import TokenSelect from './TokenSelect'
import useDebounce from '../shared/useDebounce'
import { floorToDecimal, numberFormat } from '../../utils/numbers'
import { SwapLeverageSlider } from './LeverageSlider'
import { useTranslation } from 'next-i18next'
import SwapFormTokenList from './SwapFormTokenList'
import { Transition } from '@headlessui/react'
import Button, { IconButton } from '../shared/Button'
import ButtonGroup from '../forms/ButtonGroup'
import Loading from '../shared/Loading'
import { EnterBottomExitBottom } from '../shared/Transitions'
import useJupiter from './useJupiter'
import SwapSettings from './SwapSettings'
import SheenLoader from '../shared/SheenLoader'
import { HealthType } from '@blockworks-foundation/mango-v4'
import {
  INPUT_TOKEN_DEFAULT,
  OUTPUT_TOKEN_DEFAULT,
} from '../../utils/constants'
import { useTokenMax } from './useTokenMax'
import Tooltip from '@components/shared/Tooltip'
import MaxAmountButton from '@components/shared/MaxAmountButton'

const MAX_DIGITS = 11
export const withValueLimit = (values: NumberFormatValues): boolean => {
  return values.floatValue
    ? values.floatValue.toFixed(0).length <= MAX_DIGITS
    : true
}

const SwapForm = () => {
  const { t } = useTranslation(['common', 'swap'])
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo>()
  const [amountInFormValue, setAmountInFormValue] = useState('')
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [showTokenSelect, setShowTokenSelect] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const group = mangoStore.getState().group

  const set = mangoStore.getState().set
  const useMargin = mangoStore((s) => s.swap.margin)
  const slippage = mangoStore((s) => s.swap.slippage)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const inputTokenInfo = mangoStore((s) => s.swap.inputTokenInfo)
  const outputTokenInfo = mangoStore((s) => s.swap.outputTokenInfo)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)
  const connected = mangoStore((s) => s.connected)
  const [debouncedAmountIn] = useDebounce(amountInFormValue, 300)

  const amountIn: Decimal | null = useMemo(() => {
    return Number(debouncedAmountIn)
      ? new Decimal(debouncedAmountIn)
      : new Decimal(0)
  }, [debouncedAmountIn])

  const { amountOut, jupiter, routes } = useJupiter({
    inputTokenInfo,
    outputTokenInfo,
    inputAmount: debouncedAmountIn,
    slippage,
  })

  useEffect(() => {
    setSelectedRoute(routes[0])
  }, [routes])

  useEffect(() => {
    setAmountInFormValue('')
  }, [useMargin])

  const handleAmountInChange = useCallback((e: NumberFormatValues) => {
    setAmountInFormValue(e.value)
  }, [])

  const handleTokenInSelect = useCallback(
    (mintAddress: string) => {
      const inputTokenInfo = jupiterTokens.find(
        (t: any) => t.address === mintAddress
      )
      const group = mangoStore.getState().group
      if (group) {
        const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
        set((s) => {
          s.swap.inputBank = bank
          s.swap.inputTokenInfo = inputTokenInfo
        })
      }
      setShowTokenSelect('')
    },
    [jupiterTokens, set]
  )

  const handleTokenOutSelect = useCallback(
    (mintAddress: string) => {
      const outputTokenInfo = jupiterTokens.find(
        (t: any) => t.address === mintAddress
      )
      const group = mangoStore.getState().group
      if (group) {
        const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
        set((s) => {
          s.swap.outputBank = bank
          s.swap.outputTokenInfo = outputTokenInfo
        })
      }
      setShowTokenSelect('')
    },
    [jupiterTokens, set]
  )

  const handleSwitchTokens = useCallback(() => {
    if (amountIn?.gt(0)) {
      setAmountInFormValue(amountOut.toString())
    }
    const inputBank = mangoStore.getState().swap.inputBank
    const outputBank = mangoStore.getState().swap.outputBank
    set((s) => {
      s.swap.inputBank = outputBank
      s.swap.outputBank = inputBank
      s.swap.inputTokenInfo = outputTokenInfo
      s.swap.outputTokenInfo = inputTokenInfo
    })
    setAnimateSwitchArrow(
      (prevanimateSwitchArrow) => prevanimateSwitchArrow + 1
    )
  }, [inputTokenInfo, outputTokenInfo, set, amountOut, amountIn])

  const currentMaintHealth = useMemo(() => {
    if (!group || !mangoAccount) return 0
    return mangoAccount.getHealthRatioUi(group, HealthType.maint)
  }, [mangoAccount])

  const maintProjectedHealth = useMemo(() => {
    const group = mangoStore.getState().group
    if (
      !inputTokenInfo ||
      !mangoAccount ||
      !outputTokenInfo ||
      !amountOut ||
      !group
    )
      return 0

    const simulatedHealthRatio =
      mangoAccount.simHealthRatioWithTokenPositionUiChanges(
        group,
        [
          {
            mintPk: new PublicKey(inputTokenInfo.address),
            uiTokenAmount: amountIn.toNumber() * -1,
          },
          {
            mintPk: new PublicKey(outputTokenInfo.address),
            uiTokenAmount: amountOut.toNumber(),
          },
        ],
        HealthType.maint
      )
    return simulatedHealthRatio! > 100
      ? 100
      : simulatedHealthRatio! < 0
      ? 0
      : Math.trunc(simulatedHealthRatio!)
  }, [mangoAccount, inputTokenInfo, outputTokenInfo, amountIn, amountOut])

  const loadingSwapDetails: boolean = useMemo(() => {
    return (
      !!amountIn.toNumber() && connected && (!selectedRoute || !outputTokenInfo)
    )
  }, [amountIn, connected, selectedRoute, outputTokenInfo])

  const showHealthImpact = !!inputTokenInfo && !!outputTokenInfo && !!amountOut

  return (
    <ContentBox
      hidePadding
      // showBackground
      className="relative overflow-hidden border-x-0 md:border-l md:border-r-0 md:border-t-0 md:border-b-0"
    >
      <div className="p-6 pt-3">
        <Transition
          className="thin-scroll absolute top-0 left-0 z-10 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
          show={showConfirm}
          enter="transition ease-in duration-300"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-out duration-300"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <JupiterRouteInfo
            onClose={() => setShowConfirm(false)}
            amountIn={amountIn}
            slippage={slippage}
            jupiter={jupiter}
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
            onClose={() => setShowTokenSelect('')}
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base text-th-fgd-2">{t('swap')}</h2>
          <div id="swap-step-one">
            <IconButton
              className="-mr-2 text-th-fgd-3"
              hideBg
              onClick={() => setShowSettings(true)}
              size="small"
            >
              <Cog8ToothIcon className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
        <div id="swap-step-two" className="mb-2 flex items-end justify-between">
          <p className="text-th-fgd-3">{t('swap:from')}</p>
          <MaxSwapAmount
            useMargin={useMargin}
            setAmountIn={setAmountInFormValue}
          />
        </div>
        <div className="mb-3 grid grid-cols-2">
          <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-4 bg-th-bkg-1">
            <TokenSelect
              tokenSymbol={inputTokenInfo?.symbol || INPUT_TOKEN_DEFAULT}
              showTokenList={setShowTokenSelect}
              type="input"
            />
          </div>
          <div className="col-span-1">
            <NumberFormat
              inputMode="decimal"
              thousandSeparator=","
              allowNegative={false}
              isNumericString={true}
              decimalScale={inputTokenInfo?.decimals || 6}
              name="amountIn"
              id="amountIn"
              className="w-full rounded-lg rounded-l-none border border-th-bkg-4 bg-th-bkg-1 p-3 text-right font-mono text-xl font-bold text-th-fgd-1 focus:outline-none"
              placeholder="0.00"
              value={amountInFormValue}
              onValueChange={handleAmountInChange}
              isAllowed={withValueLimit}
            />
          </div>
          {!useMargin ? (
            <PercentageSelectButtons
              amountIn={amountInFormValue}
              setAmountIn={setAmountInFormValue}
              useMargin={useMargin}
            />
          ) : null}
        </div>
        <div className="-mb-2 flex justify-center">
          <button
            className="rounded-full border border-th-bkg-4 p-1.5 text-th-fgd-3 md:hover:text-th-primary"
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
        <p className="mb-2 text-th-fgd-3">{t('swap:to')}</p>
        <div id="swap-step-three" className="mb-3 grid grid-cols-2">
          <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-4 bg-th-bkg-1">
            <TokenSelect
              tokenSymbol={outputTokenInfo?.symbol || OUTPUT_TOKEN_DEFAULT}
              showTokenList={setShowTokenSelect}
              type="output"
            />
          </div>
          <div className="flex h-[54px] w-full items-center justify-end rounded-r-lg border border-th-bkg-4 bg-th-bkg-3 text-right text-xl font-bold text-th-fgd-3">
            {loadingSwapDetails ? (
              <div className="w-full">
                <SheenLoader className="flex flex-1 rounded-l-none">
                  <div className="h-[52px] w-full rounded-r-lg bg-th-bkg-4" />
                </SheenLoader>
              </div>
            ) : (
              <span className="p-3 font-mono">
                {amountOut ? numberFormat.format(amountOut.toNumber()) : ''}
              </span>
            )}
          </div>
        </div>
        {useMargin ? (
          <>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-th-fgd-3">{t('leverage')}</p>
              {/* <p className="text-th-fgd-1">0.00x</p> */}
            </div>
            <SwapLeverageSlider
              useMargin={useMargin}
              amount={amountIn.toNumber()}
              onChange={setAmountInFormValue}
            />
          </>
        ) : null}
        <SwapFormSubmitButton
          loadingSwapDetails={loadingSwapDetails}
          useMargin={useMargin}
          setShowConfirm={setShowConfirm}
          amountIn={amountIn}
          inputSymbol={inputTokenInfo?.symbol}
          amountOut={amountOut}
        />
      </div>
      <div
        id="swap-step-four"
        className={`border-t border-th-bkg-3 px-6 py-4 transition-all`}
      >
        <div className="flex justify-between">
          <div className="flex items-center">
            <HeartIcon className="mr-1.5 h-4 w-4 text-th-fgd-4" />
            <Tooltip content="Projects the health of your account before you make a trade. The first value is your current account health and the second, your projected account health.">
              <p className="tooltip-underline text-sm">{t('health-impact')}</p>
            </Tooltip>
          </div>
          <div className="flex items-center space-x-2 font-mono">
            <p className="text-sm text-th-fgd-1">{currentMaintHealth}%</p>
            <ArrowRightIcon className="h-4 w-4 text-th-fgd-4" />
            <p
              className={`${
                maintProjectedHealth! < 50 && maintProjectedHealth! > 15
                  ? 'text-th-orange'
                  : maintProjectedHealth! <= 15
                  ? 'text-th-red'
                  : 'text-th-green'
              } text-sm`}
            >
              {maintProjectedHealth!}%{' '}
              <span
                className={`text-xs ${
                  maintProjectedHealth! >= currentMaintHealth!
                    ? 'text-th-green'
                    : 'text-th-red'
                }`}
              >
                ({maintProjectedHealth! >= currentMaintHealth! ? '+' : ''}
                {maintProjectedHealth! - currentMaintHealth!}%)
              </span>
            </p>
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
  setShowConfirm,
  useMargin,
}: {
  amountIn: Decimal
  amountOut: Decimal
  inputSymbol: string | undefined
  loadingSwapDetails: boolean
  setShowConfirm: (x: any) => any
  useMargin: boolean
}) => {
  const { t } = useTranslation('common')
  const connected = mangoStore((s) => s.connected)
  const { amount: tokenMax, amountWithBorrow } = useTokenMax(useMargin)

  const showInsufficientBalance = useMargin
    ? amountWithBorrow.lt(amountIn)
    : tokenMax.lt(amountIn)

  const disabled =
    !amountIn.toNumber() ||
    !connected ||
    showInsufficientBalance ||
    !amountOut.gt(0)

  return (
    <Button
      onClick={() => setShowConfirm(true)}
      className="mt-6 flex w-full items-center justify-center text-base"
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
        ) : disabled ? (
          <div className="flex items-center">
            <ExclamationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0" />
            No routes found
          </div>
        ) : (
          <div className="flex items-center">
            <MagnifyingGlassIcon className="mr-2 h-5 w-5" />
            {t('swap:review-swap')}
          </div>
        )
      ) : (
        <div className="flex items-center">
          <LinkIcon className="mr-2 h-5 w-5" />
          {t('connect')}
        </div>
      )}
    </Button>
  )
}

const MaxSwapAmount = ({
  setAmountIn,
  useMargin,
}: {
  setAmountIn: (x: string) => void
  useMargin: boolean
}) => {
  const { t } = useTranslation('common')
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const {
    amount: tokenMax,
    amountWithBorrow,
    decimals,
  } = useTokenMax(useMargin)

  if (mangoAccountLoading) return null

  return (
    <div className="flex flex-wrap justify-end pl-6 text-xs">
      <MaxAmountButton
        className="mb-0.5"
        label="Bal"
        onClick={() => setAmountIn(tokenMax.toFixed(decimals))}
        value={tokenMax.toFixed()}
      />
      {useMargin ? (
        <MaxAmountButton
          className="mb-0.5 ml-2"
          label={t('max')}
          onClick={() => setAmountIn(amountWithBorrow.toFixed(decimals))}
          value={amountWithBorrow.toFixed()}
        />
      ) : null}
    </div>
  )
}

const PercentageSelectButtons = ({
  amountIn,
  setAmountIn,
  useMargin,
}: {
  amountIn: string
  setAmountIn: (x: string) => any
  useMargin: boolean
}) => {
  const [sizePercentage, setSizePercentage] = useState('')
  const { amount: tokenMax, decimals } = useTokenMax(useMargin)

  useEffect(() => {
    if (tokenMax.gt(0) && amountIn && tokenMax.eq(amountIn)) {
      setSizePercentage('100')
    }
  }, [amountIn, tokenMax])

  const handleSizePercentage = (percentage: string) => {
    setSizePercentage(percentage)
    if (tokenMax.gt(0)) {
      let amount = tokenMax.mul(percentage).div(100)
      if (percentage !== '100') {
        amount = floorToDecimal(amount, decimals)
      }
      setAmountIn(amount.toFixed())
    } else {
      setAmountIn('0')
    }
  }

  return (
    <div className="col-span-2 mt-2">
      <ButtonGroup
        activeValue={sizePercentage}
        onChange={(p) => handleSizePercentage(p)}
        values={['10', '25', '50', '75', '100']}
        unit="%"
      />
    </div>
  )
}
