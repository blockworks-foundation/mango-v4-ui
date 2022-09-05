import { useState, useCallback, useEffect, useMemo } from 'react'
import { PublicKey } from '@solana/web3.js'
import {
  ArrowDownIcon,
  ArrowRightIcon,
  CogIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/solid'
import { RouteInfo } from '@jup-ag/core'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import Decimal from 'decimal.js'
import mangoStore from '../../store/mangoStore'
import ContentBox from '../shared/ContentBox'
import JupiterRouteInfo from './JupiterRouteInfo'
import TokenSelect from './TokenSelect'
import useDebounce from '../shared/useDebounce'
import { floorToDecimal, numberFormat } from '../../utils/numbers'
import { SwapLeverageSlider } from './LeverageSlider'
import { useTranslation } from 'next-i18next'
import SwapFormTokenList from './SwapFormTokenList'
import { Transition } from '@headlessui/react'
import Button, { IconButton, LinkButton } from '../shared/Button'
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

const MAX_DIGITS = 11
export const withValueLimit = (values: NumberFormatValues): boolean => {
  return values.floatValue
    ? values.floatValue.toFixed(0).length <= MAX_DIGITS
    : true
}

const SwapForm = () => {
  const { t } = useTranslation('common')
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo>()
  const [amountInFormValue, setAmountInFormValue] = useState('')
  const [animateSwitchArrow, setAnimateSwitchArrow] = useState(0)
  const [showTokenSelect, setShowTokenSelect] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const set = mangoStore.getState().set
  const useMargin = mangoStore((s) => s.swap.margin)
  const slippage = mangoStore((s) => s.swap.slippage)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const inputTokenInfo = mangoStore((s) => s.swap.inputTokenInfo)
  const outputTokenInfo = mangoStore((s) => s.swap.outputTokenInfo)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)
  const connected = mangoStore((s) => s.connected)
  const [debouncedAmountIn] = useDebounce(amountInFormValue, 300)
  const {
    amount: tokenMax,
    amountWithBorrow,
    decimals,
  } = useTokenMax(useMargin)

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
    if (!mangoAccount) return 0
    return mangoAccount.getHealthRatioUi(HealthType.maint)
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

  const isLoadingTradeDetails = useMemo(() => {
    return (
      amountIn.toNumber() && connected && (!selectedRoute || !outputTokenInfo)
    )
  }, [amountIn, connected, selectedRoute, outputTokenInfo])

  const showHealthImpact = !!inputTokenInfo && !!outputTokenInfo && !!amountOut

  const showInsufficientBalance = useMargin
    ? amountWithBorrow.lt(amountIn)
    : tokenMax.lt(amountIn)

  return (
    <ContentBox hidePadding showBackground className="relative overflow-hidden">
      <div className="p-6">
        <Transition
          className="thin-scroll absolute top-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-2 p-6 pb-0"
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
          className="thin-scroll absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-2 p-6 pb-0"
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
          />
        </EnterBottomExitBottom>
        <EnterBottomExitBottom
          className="thin-scroll absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-2 p-6 pb-0"
          show={showSettings}
        >
          <SwapSettings onClose={() => setShowSettings(false)} />
        </EnterBottomExitBottom>
        <div className="mb-4 flex items-center justify-between">
          <h3>{t('trade')}</h3>
          <IconButton
            className="text-th-fgd-3"
            onClick={() => setShowSettings(true)}
            size="small"
          >
            <CogIcon className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-th-fgd-3">{t('sell')}</p>
          <MaxSwapAmount
            amountWithBorrow={amountWithBorrow}
            useMargin={useMargin}
            setAmountIn={setAmountInFormValue}
            tokenMax={tokenMax}
            decimals={decimals}
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
              className="w-full rounded-lg rounded-l-none border border-th-bkg-4 bg-th-bkg-1 p-3 text-right text-xl font-bold tracking-wider text-th-fgd-1 focus:outline-none"
              placeholder="0.00"
              value={amountInFormValue}
              onValueChange={handleAmountInChange}
              isAllowed={withValueLimit}
            />
          </div>
          {!useMargin ? (
            <PercentageSelectButtons
              amountIn={amountInFormValue}
              decimals={decimals}
              setAmountIn={setAmountInFormValue}
              tokenMax={tokenMax}
            />
          ) : null}
        </div>
        <div className="flex justify-center">
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
        <p className="mb-2 text-th-fgd-3">{t('buy')}</p>
        <div className="mb-3 grid grid-cols-2">
          <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-4 bg-th-bkg-1">
            <TokenSelect
              tokenSymbol={outputTokenInfo?.symbol || OUTPUT_TOKEN_DEFAULT}
              showTokenList={setShowTokenSelect}
              type="output"
            />
          </div>
          <div className="flex h-[54px] w-full items-center justify-end rounded-r-lg border border-th-bkg-4 bg-th-bkg-3 text-right text-xl font-bold tracking-wider text-th-fgd-3">
            {isLoadingTradeDetails ? (
              <div className="w-full">
                <SheenLoader className="rounded-l-none">
                  <div className="h-[52px] w-full rounded-r-lg bg-th-bkg-3" />
                </SheenLoader>
              </div>
            ) : (
              <span className="p-3">
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
              amount={amountIn.toNumber()}
              onChange={setAmountInFormValue}
            />
          </>
        ) : null}
        <Button
          onClick={() => setShowConfirm(true)}
          className="mt-6 flex w-full items-center justify-center text-base"
          disabled={
            !amountIn.toNumber() ||
            !connected ||
            !routes?.length ||
            !selectedRoute ||
            !outputTokenInfo ||
            showInsufficientBalance
          }
          size="large"
        >
          {connected ? (
            showInsufficientBalance ? (
              <div className="flex items-center">
                <ExclamationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                {t('trade:insufficient-balance', {
                  symbol: inputTokenInfo?.symbol,
                })}
              </div>
            ) : isLoadingTradeDetails ? (
              <Loading />
            ) : (
              <div className="flex items-center">{t('trade:review-trade')}</div>
            )
          ) : (
            t('connect')
          )}
        </Button>
      </div>

      {!!mangoAccount ? (
        <div
          className={`bg-th-bkg-3 px-6  transition-all ${
            showHealthImpact ? 'max-h-40 py-4 ' : 'h-0'
          }`}
        >
          <div className="flex justify-between">
            <p className="text-sm">{t('health-impact')}</p>
            <div className="flex items-center space-x-2">
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
      ) : null}
    </ContentBox>
  )
}

export default SwapForm

const MaxSwapAmount = ({
  amountWithBorrow,
  setAmountIn,
  tokenMax,
  useMargin,
  decimals,
}: {
  amountWithBorrow: Decimal
  setAmountIn: (x: string) => void
  tokenMax: Decimal
  useMargin: boolean
  decimals: number
}) => {
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const { t } = useTranslation('common')

  const setMaxInputAmount = () => {
    const amountIn = useMargin ? amountWithBorrow : tokenMax
    setAmountIn(amountIn.toFixed(decimals))
  }

  if (mangoAccountLoading) return null

  const maxAmount = useMargin ? amountWithBorrow : tokenMax

  return (
    <LinkButton className="no-underline" onClick={setMaxInputAmount}>
      <span className="font-normal text-th-fgd-4">{t('max')}:</span>
      <span className="mx-1 text-th-fgd-3 underline">
        {maxAmount.toFixed()}
      </span>
    </LinkButton>
  )
}

const PercentageSelectButtons = ({
  amountIn,
  decimals,
  setAmountIn,
  tokenMax,
}: {
  amountIn: string
  decimals: number
  setAmountIn: (x: string) => any
  tokenMax: Decimal
}) => {
  const [sizePercentage, setSizePercentage] = useState('')

  useEffect(() => {
    if (tokenMax.gt(0) && tokenMax.eq(amountIn)) {
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
