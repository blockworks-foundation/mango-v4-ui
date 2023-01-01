import {
  PerpMarket,
  PerpOrderSide,
  PerpOrderType,
  Serum3Market,
  Serum3OrderType,
  Serum3SelfTradeBehavior,
  Serum3Side,
} from '@blockworks-foundation/mango-v4'
import Checkbox from '@components/forms/Checkbox'
import Button from '@components/shared/Button'
import Tooltip from '@components/shared/Tooltip'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import NumberFormat, {
  NumberFormatValues,
  SourceInfo,
} from 'react-number-format'
import { notify } from 'utils/notifications'
import SpotSlider from './SpotSlider'
import { calculateLimitPriceForMarketOrder } from 'utils/tradeForm'
import Image from 'next/legacy/image'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import Loading from '@components/shared/Loading'
import TabUnderline from '@components/shared/TabUnderline'
import PerpSlider from './PerpSlider'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { SIZE_INPUT_UI_KEY } from 'utils/constants'
import SpotButtonGroup from './SpotButtonGroup'
import PerpButtonGroup from './PerpButtonGroup'
import SolBalanceWarnings from '@components/shared/SolBalanceWarnings'
import useJupiterMints from 'hooks/useJupiterMints'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { getDecimalCount } from 'utils/numbers'
import LogoWithFallback from '@components/shared/LogoWithFallback'
import useIpAddress from 'hooks/useIpAddress'
import ButtonGroup from '@components/forms/ButtonGroup'
import TradeSummary from './TradeSummary'
import useMangoAccount from 'hooks/useMangoAccount'
import MaxSizeButton from './MaxSizeButton'

const set = mangoStore.getState().set

const AdvancedTradeForm = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { mangoAccount } = useMangoAccount()
  const tradeForm = mangoStore((s) => s.tradeForm)
  const { mangoTokens } = useJupiterMints()
  const { selectedMarket, price: oraclePrice } = useSelectedMarket()
  const [useMargin, setUseMargin] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [tradeFormSizeUi] = useLocalStorageState(SIZE_INPUT_UI_KEY, 'Slider')
  const { ipAllowed, ipCountry } = useIpAddress()

  const baseSymbol = useMemo(() => {
    return selectedMarket?.name.split(/-|\//)[0]
  }, [selectedMarket])

  const baseLogoURI = useMemo(() => {
    if (!baseSymbol || !mangoTokens.length) return ''
    const token =
      mangoTokens.find((t) => t.symbol === baseSymbol) ||
      mangoTokens.find((t) => t.symbol?.includes(baseSymbol))
    if (token) {
      return token.logoURI
    }
    return ''
  }, [baseSymbol, mangoTokens])

  const quoteBank = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return
    const tokenIdx =
      selectedMarket instanceof Serum3Market
        ? selectedMarket.quoteTokenIndex
        : selectedMarket?.settleTokenIndex
    return group?.getFirstBankByTokenIndex(tokenIdx)
  }, [selectedMarket])

  const quoteSymbol = useMemo(() => {
    return quoteBank?.name
  }, [quoteBank])

  const quoteLogoURI = useMemo(() => {
    if (!quoteSymbol || !mangoTokens.length) return ''
    const token = mangoTokens.find((t) => t.symbol === quoteSymbol)
    if (token) {
      return token.logoURI
    }
    return ''
  }, [quoteSymbol, mangoTokens])

  const setTradeType = useCallback((tradeType: 'Limit' | 'Market') => {
    set((s) => {
      s.tradeForm.tradeType = tradeType
    })
  }, [])

  const handlePriceChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      set((s) => {
        s.tradeForm.price = e.value
        if (s.tradeForm.baseSize && !Number.isNaN(Number(e.value))) {
          s.tradeForm.quoteSize = (
            (parseFloat(e.value) || 0) * parseFloat(s.tradeForm.baseSize)
          ).toString()
        }
      })
    },
    []
  )

  const handleBaseSizeChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      set((s) => {
        const price =
          s.tradeForm.tradeType === 'Market'
            ? oraclePrice
            : Number(s.tradeForm.price)

        s.tradeForm.baseSize = e.value
        if (price && e.value !== '' && !Number.isNaN(Number(e.value))) {
          s.tradeForm.quoteSize = (price * parseFloat(e.value)).toString()
        } else {
          s.tradeForm.quoteSize = ''
        }
      })
    },
    [oraclePrice]
  )

  const handleQuoteSizeChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      set((s) => {
        const price =
          s.tradeForm.tradeType === 'Market'
            ? oraclePrice
            : Number(s.tradeForm.price)

        s.tradeForm.quoteSize = e.value
        if (price && e.value !== '' && !Number.isNaN(Number(e.value))) {
          s.tradeForm.baseSize = (parseFloat(e.value) / price).toString()
        } else {
          s.tradeForm.baseSize = ''
        }
      })
    },
    [oraclePrice]
  )

  const handlePostOnlyChange = useCallback((postOnly: boolean) => {
    set((s) => {
      s.tradeForm.postOnly = postOnly
      if (s.tradeForm.ioc === true) {
        s.tradeForm.ioc = !postOnly
      }
    })
  }, [])

  const handleIocChange = useCallback((ioc: boolean) => {
    set((s) => {
      s.tradeForm.ioc = ioc
      if (s.tradeForm.postOnly === true) {
        s.tradeForm.postOnly = !ioc
      }
    })
  }, [])

  const handleSetSide = useCallback((side: 'buy' | 'sell') => {
    set((s) => {
      s.tradeForm.side = side
    })
  }, [])

  const tickDecimals = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return 1
    let tickSize: number
    if (selectedMarket instanceof Serum3Market) {
      const market = group.getSerum3ExternalMarket(
        selectedMarket.serumMarketExternal
      )
      tickSize = market.tickSize
    } else {
      tickSize = selectedMarket.tickSize
    }
    return getDecimalCount(tickSize)
  }, [selectedMarket])

  /*
   * Updates the limit price on page load
   */
  useEffect(() => {
    if (tradeForm.price === undefined) {
      const group = mangoStore.getState().group
      if (!group || !oraclePrice) return

      set((s) => {
        s.tradeForm.price = oraclePrice.toFixed(tickDecimals)
      })
    }
  }, [oraclePrice, tickDecimals, tradeForm.price])

  /*
   * Updates the price and the quote size when a Market order is selected
   */
  useEffect(() => {
    const group = mangoStore.getState().group
    if (
      tradeForm.tradeType === 'Market' &&
      oraclePrice &&
      selectedMarket &&
      group
    ) {
      if (!isNaN(parseFloat(tradeForm.baseSize))) {
        const baseSize = new Decimal(tradeForm.baseSize)?.toNumber()
        const quoteSize = baseSize * oraclePrice
        set((s) => {
          s.tradeForm.price = oraclePrice.toFixed(tickDecimals)
          s.tradeForm.quoteSize = quoteSize.toFixed(tickDecimals)
        })
      } else {
        set((s) => {
          s.tradeForm.price = oraclePrice.toFixed(tickDecimals)
        })
      }
    }
  }, [oraclePrice, selectedMarket, tickDecimals, tradeForm])

  const handlePlaceOrder = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const tradeForm = mangoStore.getState().tradeForm
    const actions = mangoStore.getState().actions
    const selectedMarket = mangoStore.getState().selectedMarket.current

    if (!group || !mangoAccount) return
    setPlacingOrder(true)
    try {
      const baseSize = Number(tradeForm.baseSize)
      let price = Number(tradeForm.price)
      if (tradeForm.tradeType === 'Market') {
        const orderbook = mangoStore.getState().selectedMarket.orderbook
        price = calculateLimitPriceForMarketOrder(
          orderbook,
          baseSize,
          tradeForm.side
        )
      }

      if (selectedMarket instanceof Serum3Market) {
        const spotOrderType = tradeForm.ioc
          ? Serum3OrderType.immediateOrCancel
          : tradeForm.postOnly
          ? Serum3OrderType.postOnly
          : Serum3OrderType.limit
        const tx = await client.serum3PlaceOrder(
          group,
          mangoAccount,
          selectedMarket.serumMarketExternal,
          tradeForm.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
          price,
          baseSize,
          Serum3SelfTradeBehavior.decrementTake,
          spotOrderType,
          Date.now(),
          10
        )
        actions.fetchOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx,
        })
      } else if (selectedMarket instanceof PerpMarket) {
        const perpOrderType =
          tradeForm.tradeType === 'Market'
            ? PerpOrderType.market
            : tradeForm.ioc
            ? PerpOrderType.immediateOrCancel
            : tradeForm.postOnly
            ? PerpOrderType.postOnly
            : PerpOrderType.limit
        const tx = await client.perpPlaceOrder(
          group,
          mangoAccount,
          selectedMarket.perpMarketIndex,
          tradeForm.side === 'buy' ? PerpOrderSide.bid : PerpOrderSide.ask,
          price,
          Math.abs(baseSize),
          undefined, // maxQuoteQuantity
          Date.now(),
          perpOrderType,
          undefined,
          undefined
        )
        actions.fetchOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx,
        })
      }
    } catch (e: any) {
      notify({
        title: 'There was an issue.',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
      console.error('Place trade error:', e)
    } finally {
      setPlacingOrder(false)
    }
  }, [])

  const minOrderDecimals = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return 1
    let minOrderDecimals = 1
    if (selectedMarket instanceof Serum3Market) {
      const market = group.getSerum3ExternalMarket(
        selectedMarket.serumMarketExternal
      )
      minOrderDecimals = getDecimalCount(market.minOrderSize)
    } else {
      minOrderDecimals = getDecimalCount(selectedMarket.minOrderSize)
    }
    return minOrderDecimals
  }, [selectedMarket])

  return (
    <div>
      <div className="mt-1.5 px-2 md:mt-0 md:border-t md:border-th-bkg-3 md:px-4 md:pt-5 lg:mt-5 lg:border-t-0 lg:pt-0">
        <TabUnderline
          activeValue={tradeForm.side}
          values={['buy', 'sell']}
          onChange={(v) => handleSetSide(v)}
          small
        />
      </div>
      <div className="px-3 md:px-4">
        <SolBalanceWarnings />
      </div>
      <div className="mt-1 px-2 md:mt-3 md:px-4">
        <p className="mb-2 text-xs">{t('trade:order-type')}</p>
        <ButtonGroup
          activeValue={tradeForm.tradeType}
          onChange={(tab: 'Limit' | 'Market') => setTradeType(tab)}
          values={['Limit', 'Market']}
        />
      </div>
      <div className="mt-3 px-3 md:px-4">
        {tradeForm.tradeType === 'Limit' ? (
          <>
            <div className="mb-2 mt-3 flex items-center justify-between">
              <p className="text-xs text-th-fgd-3">{t('trade:limit-price')}</p>
            </div>
            <div className="default-transition flex items-center rounded-md border border-th-input-border bg-th-input-bkg p-2 text-sm font-bold text-th-fgd-1 md:hover:border-th-input-border-hover lg:text-base">
              {quoteLogoURI ? (
                <div className="h-5 w-5 flex-shrink-0">
                  <Image alt="" width="20" height="20" src={quoteLogoURI} />
                </div>
              ) : (
                <div className="h-5 w-5 flex-shrink-0">
                  <QuestionMarkCircleIcon className="h-5 w-5 text-th-fgd-3" />
                </div>
              )}
              <NumberFormat
                inputMode="decimal"
                thousandSeparator=","
                allowNegative={false}
                isNumericString={true}
                decimalScale={6}
                name="amountIn"
                id="amountIn"
                className="ml-2 w-full bg-transparent font-mono focus:outline-none"
                placeholder="0.00"
                value={tradeForm.price}
                onValueChange={handlePriceChange}
              />
              <div className="text-xs font-normal text-th-fgd-4">
                {quoteSymbol}
              </div>
            </div>
          </>
        ) : null}
        <MaxSizeButton
          minOrderDecimals={minOrderDecimals}
          tickDecimals={tickDecimals}
        />
        <div className="flex flex-col">
          <div className="default-transition flex items-center rounded-md rounded-b-none border border-th-input-border bg-th-input-bkg p-2 text-sm font-bold text-th-fgd-1 md:hover:z-10 md:hover:border-th-input-border-hover lg:text-base">
            <div className="h-5 w-5 flex-shrink-0">
              <LogoWithFallback
                alt=""
                className="z-10 drop-shadow-md"
                width={'24'}
                height={'24'}
                src={baseLogoURI || `/icons/${baseSymbol?.toLowerCase()}.svg`}
                fallback={
                  <QuestionMarkCircleIcon className={`h-5 w-5 text-th-fgd-3`} />
                }
              />
            </div>
            <NumberFormat
              inputMode="decimal"
              thousandSeparator=","
              allowNegative={false}
              isNumericString={true}
              decimalScale={6}
              name="amountIn"
              id="amountIn"
              className="ml-2 w-full bg-transparent font-mono focus:outline-none"
              placeholder="0.00"
              value={tradeForm.baseSize}
              onValueChange={handleBaseSizeChange}
            />
            <div className="text-xs font-normal text-th-fgd-4">
              {baseSymbol}
            </div>
          </div>
          <div className="default-transition -mt-[1px] flex items-center rounded-md rounded-t-none border border-th-input-border bg-th-input-bkg p-2 text-sm font-bold text-th-fgd-1 md:hover:border-th-input-border-hover lg:text-base">
            {quoteLogoURI ? (
              <div className="h-5 w-5 flex-shrink-0">
                <Image alt="" width="20" height="20" src={quoteLogoURI} />
              </div>
            ) : (
              <div className="h-5 w-5 flex-shrink-0">
                <QuestionMarkCircleIcon className="h-5 w-5 text-th-fgd-3" />
              </div>
            )}
            <NumberFormat
              inputMode="decimal"
              thousandSeparator=","
              allowNegative={false}
              isNumericString={true}
              decimalScale={6}
              name="amountIn"
              id="amountIn"
              className="ml-2 w-full bg-transparent font-mono focus:outline-none"
              placeholder="0.00"
              value={tradeForm.quoteSize}
              onValueChange={handleQuoteSizeChange}
            />
            <div className="text-xs font-normal text-th-fgd-4">
              {quoteSymbol}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 flex">
        {selectedMarket instanceof Serum3Market ? (
          tradeFormSizeUi === 'slider' ? (
            <SpotSlider
              minOrderDecimals={minOrderDecimals}
              tickDecimals={tickDecimals}
            />
          ) : (
            <SpotButtonGroup
              minOrderDecimals={minOrderDecimals}
              tickDecimals={tickDecimals}
            />
          )
        ) : tradeFormSizeUi === 'slider' ? (
          <PerpSlider
            minOrderDecimals={minOrderDecimals}
            tickDecimals={tickDecimals}
          />
        ) : (
          <PerpButtonGroup
            minOrderDecimals={minOrderDecimals}
            tickDecimals={tickDecimals}
          />
        )}
      </div>
      <div className="flex flex-wrap px-5 md:flex-nowrap">
        {tradeForm.tradeType === 'Limit' ? (
          <div className="flex">
            <div className="mr-3 mt-4" id="trade-step-six">
              <Tooltip
                className="hidden md:block"
                delay={250}
                placement="left"
                content={t('trade:tooltip-post')}
              >
                <Checkbox
                  checked={tradeForm.postOnly}
                  onChange={(e) => handlePostOnlyChange(e.target.checked)}
                >
                  {t('trade:post')}
                </Checkbox>
              </Tooltip>
            </div>
            <div className="mr-3 mt-4" id="trade-step-seven">
              <Tooltip
                className="hidden md:block"
                delay={250}
                placement="left"
                content={t('trade:tooltip-ioc')}
              >
                <div className="flex items-center text-xs text-th-fgd-3">
                  <Checkbox
                    checked={tradeForm.ioc}
                    onChange={(e) => handleIocChange(e.target.checked)}
                  >
                    IOC
                  </Checkbox>
                </div>
              </Tooltip>
            </div>
          </div>
        ) : null}
        {selectedMarket instanceof Serum3Market ? (
          <div className="mt-4" id="trade-step-eight">
            <Tooltip
              delay={250}
              placement="left"
              content={t('trade:tooltip-enable-margin')}
            >
              <Checkbox
                checked={useMargin}
                onChange={(e) => setUseMargin(e.target.checked)}
              >
                {t('trade:margin')}
              </Checkbox>
            </Tooltip>
          </div>
        ) : null}
      </div>
      <div className="mt-6 mb-4 flex px-3 md:px-4">
        {ipAllowed ? (
          <Button
            onClick={handlePlaceOrder}
            className={`flex w-full items-center justify-center text-white ${
              tradeForm.side === 'buy'
                ? 'bg-th-up-dark md:hover:bg-th-up'
                : 'bg-th-down-dark md:hover:bg-th-down'
            }`}
            disabled={!tradeForm.baseSize}
            size="large"
          >
            {!placingOrder ? (
              <span className="capitalize">
                {t('trade:place-order', { side: tradeForm.side })}
              </span>
            ) : (
              <div className="flex items-center space-x-2">
                <Loading />
                <span>{t('trade:placing-order')}</span>
              </div>
            )}
          </Button>
        ) : (
          <div className="flex-grow">
            <div className="flex">
              <Button disabled className="flex-grow">
                <span>
                  {t('country-not-allowed', {
                    country: ipCountry ? `(${ipCountry})` : '(Unknown)',
                  })}
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
      <TradeSummary mangoAccount={mangoAccount} />
    </div>
  )
}

export default AdvancedTradeForm
