import {
  Serum3Market,
  Serum3OrderType,
  Serum3SelfTradeBehavior,
  Serum3Side,
} from '@blockworks-foundation/mango-v4'
import Checkbox from '@components/forms/Checkbox'
import Button from '@components/shared/Button'
import TabButtons from '@components/shared/TabButtons'
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
import { calculateMarketPrice } from 'utils/tradeForm'
import Image from 'next/image'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import Loading from '@components/shared/Loading'
import { Market } from '@project-serum/serum'

const TABS: [string, number][] = [
  ['Limit', 0],
  ['Market', 0],
]

const AdvancedTradeForm = () => {
  const { t } = useTranslation(['common', 'trade'])
  const set = mangoStore.getState().set
  const tradeForm = mangoStore((s) => s.tradeForm)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)
  const [useMargin, setUseMargin] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)

  const baseSymbol = useMemo(() => {
    return selectedMarket?.name.split('/')[0]
  }, [selectedMarket])

  const baseLogoURI = useMemo(() => {
    if (!baseSymbol || !jupiterTokens.length) return ''
    const token = jupiterTokens.find((t) => t.symbol === baseSymbol)
    if (token) {
      return token.logoURI
    }
    return ''
  }, [baseSymbol, jupiterTokens])

  const quoteSymbol = useMemo(() => {
    return selectedMarket?.name.split('/')[1]
  }, [selectedMarket])

  const quoteLogoURI = useMemo(() => {
    if (!quoteSymbol || !jupiterTokens.length) return ''
    const token = jupiterTokens.find((t) => t.symbol === quoteSymbol)
    if (token) {
      return token.logoURI
    }
    return ''
  }, [quoteSymbol, jupiterTokens])

  const setTradeType = useCallback(
    (tradeType: 'Limit' | 'Market') => {
      set((s) => {
        s.tradeForm.tradeType = tradeType
      })
    },
    [set]
  )

  const handlePriceChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return
      set((s) => {
        s.tradeForm.price = e.value
        if (s.tradeForm.baseSize && Number(e.value)) {
          s.tradeForm.quoteSize = (
            parseFloat(e.value) * parseFloat(s.tradeForm.baseSize)
          ).toString()
        }
      })
    },
    [set]
  )

  const handleBaseSizeChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return

      set((s) => {
        s.tradeForm.baseSize = e.value

        if (s.tradeForm.price && Number(e.value)) {
          s.tradeForm.quoteSize = (
            parseFloat(s.tradeForm.price) * parseFloat(e.value)
          ).toString()
        }
      })
    },
    [set]
  )

  const handleQuoteSizeChange = useCallback(
    (e: NumberFormatValues, info: SourceInfo) => {
      if (info.source !== 'event') return

      set((s) => {
        s.tradeForm.quoteSize = e.value

        if (Number(s.tradeForm.price)) {
          s.tradeForm.baseSize = (
            parseFloat(e.value) / parseFloat(s.tradeForm.price)
          ).toString()
        }
      })
    },
    [set]
  )

  const handlePostOnlyChange = useCallback(
    (postOnly: boolean) => {
      set((s) => {
        s.tradeForm.postOnly = postOnly
        if (s.tradeForm.ioc === true) {
          s.tradeForm.ioc = !postOnly
        }
      })
    },
    [set]
  )

  const handleIocChange = useCallback(
    (ioc: boolean) => {
      set((s) => {
        s.tradeForm.ioc = ioc
        if (s.tradeForm.postOnly === true) {
          s.tradeForm.postOnly = !ioc
        }
      })
    },
    [set]
  )

  const handleSetSide = useCallback(
    (side: 'buy' | 'sell') => {
      set((s) => {
        s.tradeForm.side = side
      })
    },
    [set]
  )

  useEffect(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return
    if (selectedMarket instanceof Serum3Market) {
      const baseBank = group?.getFirstBankByTokenIndex(
        selectedMarket.baseTokenIndex
      )
      if (baseBank.uiPrice) {
        const price = baseBank.uiPrice.toString()
        set((s) => {
          s.tradeForm.price = price
        })
      }
    } else {
      set((s) => {
        s.tradeForm.price = selectedMarket._uiPrice.toString()
      })
    }
  }, [set, selectedMarket])

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
      const orderType = tradeForm.ioc
        ? Serum3OrderType.immediateOrCancel
        : tradeForm.postOnly
        ? Serum3OrderType.postOnly
        : Serum3OrderType.limit

      let baseSize = new Decimal(tradeForm.baseSize).toNumber()
      let price = new Decimal(tradeForm.price).toNumber()
      if (tradeForm.tradeType === 'Market') {
        const orderbook = mangoStore.getState().selectedMarket.orderbook
        price = calculateMarketPrice(orderbook, baseSize, tradeForm.side)
      }

      if (selectedMarket instanceof Serum3Market) {
        const tx = await client.serum3PlaceOrder(
          group,
          mangoAccount,
          selectedMarket!.serumMarketExternal,
          tradeForm.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
          price,
          baseSize,
          Serum3SelfTradeBehavior.decrementTake,
          orderType,
          Date.now(),
          10
        )
        actions.reloadMangoAccount()
        actions.fetchSerumOpenOrders()
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
  }, [t])

  return (
    <div>
      <div className="border-b border-th-bkg-3">
        <TabButtons
          activeValue={tradeForm.tradeType}
          onChange={(tab: 'Limit' | 'Market') => setTradeType(tab)}
          values={TABS}
          fillWidth
        />
      </div>
      <div className="mt-6 px-4">
        <div
          className={`relative mb-3 pb-1 md:-mt-2.5 md:border-b md:border-th-bkg-3`}
        >
          <div
            className={`absolute hidden md:block ${
              tradeForm.side === 'buy'
                ? 'translate-x-0 bg-th-green'
                : 'translate-x-full bg-th-red'
            } default-transition bottom-[-1px] left-0 h-0.5 w-1/2 transform`}
          />
          <nav className="-mb-px flex space-x-2" aria-label="Tabs">
            <button
              onClick={() => handleSetSide('buy')}
              className={`default-transition relative flex h-10 w-1/2 
            cursor-pointer items-center justify-center whitespace-nowrap rounded py-1 text-sm font-semibold md:h-auto md:rounded-none md:text-base md:hover:opacity-100
            ${
              tradeForm.side === 'buy'
                ? `border border-th-green text-th-green md:border-0`
                : `border border-th-fgd-4 text-th-fgd-4 md:border-0 md:hover:border-th-green md:hover:text-th-green`
            }
          `}
            >
              {t('buy')}
            </button>
            <button
              onClick={() => handleSetSide('sell')}
              className={`default-transition relative flex h-10 w-1/2 cursor-pointer items-center justify-center whitespace-nowrap 
            rounded py-1 text-sm font-semibold md:h-auto md:rounded-none md:text-base md:hover:opacity-100
            ${
              tradeForm.side === 'sell'
                ? `border border-th-red text-th-red md:border-0`
                : `border border-th-fgd-4 text-th-fgd-4 md:border-0 md:hover:border-th-red md:hover:text-th-red`
            }
          `}
            >
              {t('sell')}
            </button>
          </nav>
        </div>
      </div>
      <div className="mt-4 px-4">
        {tradeForm.tradeType === 'Limit' ? (
          <>
            <div className="mb-2 mt-4 flex items-center justify-between">
              <p className="text-xs text-th-fgd-3">{t('trade:limit-price')}</p>
            </div>
            <div className="default-transition flex items-center rounded-md border border-th-bkg-4 bg-th-bkg-1 p-2 text-xs font-bold text-th-fgd-1 md:hover:border-th-fgd-4 md:hover:bg-th-bkg-2 lg:text-base">
              <NumberFormat
                inputMode="decimal"
                thousandSeparator=","
                allowNegative={false}
                isNumericString={true}
                decimalScale={6}
                name="amountIn"
                id="amountIn"
                className="w-full bg-transparent font-mono focus:outline-none"
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
        <div className="my-2 flex items-center justify-between">
          <p className="text-xs text-th-fgd-3">{t('trade:amount')}</p>
        </div>
        <div className="flex flex-col">
          <div className="default-transition flex items-center rounded-md rounded-b-none border border-th-bkg-4 bg-th-bkg-1 p-2 text-xs font-bold text-th-fgd-1 md:hover:z-10 md:hover:border-th-fgd-4 md:hover:bg-th-bkg-2 lg:text-base">
            {baseLogoURI ? (
              <Image
                className="rounded-full"
                alt=""
                width="24"
                height="24"
                src={baseLogoURI}
              />
            ) : (
              <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
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
              value={tradeForm.baseSize}
              onValueChange={handleBaseSizeChange}
            />
            <div className="text-xs font-normal text-th-fgd-4">
              {baseSymbol}
            </div>
          </div>
          <div className="default-transition -mt-[1px] flex items-center rounded-md rounded-t-none border border-th-bkg-4 bg-th-bkg-1 p-2 text-xs font-bold text-th-fgd-1 md:hover:border-th-fgd-4 md:hover:bg-th-bkg-2 lg:text-base">
            {quoteLogoURI ? (
              <Image
                className="rounded-full"
                alt=""
                width="24"
                height="24"
                src={quoteLogoURI}
              />
            ) : (
              <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
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
      <div className="mt-4 flex">
        <SpotSlider />
      </div>
      <div className="flex flex-wrap px-5">
        {tradeForm.tradeType === 'Limit' ? (
          <div className="flex">
            <div className="mr-4 mt-4" id="trade-step-six">
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
            <div className="mr-4 mt-4" id="trade-step-seven">
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
      </div>
      <div className="mt-6 flex px-4">
        <Button
          onClick={handlePlaceOrder}
          className={`flex w-full items-center justify-center text-white ${
            tradeForm.side === 'buy'
              ? 'bg-th-green-dark md:hover:bg-th-green'
              : 'bg-th-red-dark md:hover:bg-th-red'
          }`}
          disabled={false}
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
      </div>
    </div>
  )
}

export default AdvancedTradeForm
