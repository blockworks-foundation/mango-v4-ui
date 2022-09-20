import {
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
import { useCallback, useMemo, useState } from 'react'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import { notify } from 'utils/notifications'

const AdvancedTradeForm = () => {
  const { t } = useTranslation('common')
  const set = mangoStore.getState().set
  const tradeForm = mangoStore((s) => s.tradeForm)
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)
  const [useMargin, setUseMargin] = useState(true)

  const baseSymbol = useMemo(() => {
    return selectedMarket?.name.split('/')[0]
  }, [selectedMarket])

  const quoteSymbol = useMemo(() => {
    return selectedMarket?.name.split('/')[1]
  }, [selectedMarket])

  const setTradeType = useCallback(
    (tradeType: 'Limit' | 'Market') => {
      set((s) => {
        s.tradeForm.tradeType = tradeType
      })
    },
    [set]
  )

  const handlePriceChange = useCallback(
    (e: NumberFormatValues) => {
      set((s) => {
        s.tradeForm.price = e.value
      })
    },
    [set]
  )

  const handleBaseSizeChange = useCallback(
    (e: NumberFormatValues) => {
      set((s) => {
        s.tradeForm.baseSize = e.value
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

  const handlePlaceOrder = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const tradeForm = mangoStore.getState().tradeForm
    const actions = mangoStore.getState().actions

    if (!group || !mangoAccount) return

    try {
      const orderType = tradeForm.ioc
        ? Serum3OrderType.immediateOrCancel
        : tradeForm.postOnly
        ? Serum3OrderType.postOnly
        : Serum3OrderType.limit

      const tx = await client.serum3PlaceOrder(
        group,
        mangoAccount,
        selectedMarket!.serumMarketExternal,
        tradeForm.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
        new Decimal(tradeForm.price).toNumber(),
        new Decimal(tradeForm.baseSize).toNumber(),
        Serum3SelfTradeBehavior.decrementTake,
        orderType,
        Date.now(),
        10
      )
      actions.reloadMangoAccount()
      notify({
        type: 'success',
        title: 'Transaction successful',
        txid: tx,
      })
    } catch (e: any) {
      notify({
        title: t('order-error'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
      console.error('Place trade error:', e)
    }
  }, [])

  return (
    <div>
      <div className="grid select-none grid-cols-2 justify-between border-b border-th-bkg-3 text-base">
        <div
          onClick={() => setTradeType('Limit')}
          className={`flex h-12 items-center justify-center px-4 text-sm font-bold hover:cursor-pointer ${
            tradeForm.tradeType === 'Limit'
              ? 'bg-th-bkg-2 text-th-primary'
              : 'text-th-fgd-4 hover:text-th-fgd-2'
          }`}
        >
          Limit
        </div>
        <div
          onClick={() => setTradeType('Market')}
          className={`flex h-12 items-center justify-center px-4 text-sm font-bold hover:cursor-pointer ${
            tradeForm.tradeType === 'Market'
              ? 'bg-th-bkg-2 text-th-primary'
              : 'text-th-fgd-4 hover:text-th-fgd-2'
          }`}
        >
          Market
        </div>
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
        <div className="my-2 flex items-center justify-between">
          <p className="text-xs text-th-fgd-3">{t('amount')}</p>
        </div>
        <div className="default-transition flex items-center rounded-md border border-th-bkg-4 bg-th-bkg-1 p-3 text-sm font-bold text-th-fgd-1 md:py-2 md:text-lg md:hover:border-th-fgd-4 md:hover:bg-th-bkg-2">
          <NumberFormat
            inputMode="decimal"
            thousandSeparator=","
            allowNegative={false}
            isNumericString={true}
            decimalScale={6}
            name="amountIn"
            id="amountIn"
            className="w-full bg-transparent font-mono tracking-tight focus:outline-none"
            placeholder="0.00"
            value={tradeForm.baseSize}
            onValueChange={handleBaseSizeChange}
          />
          <div className="ml-2 text-sm font-normal text-th-fgd-4">
            {baseSymbol}
          </div>
        </div>
        {tradeForm.tradeType === 'Limit' ? (
          <>
            <div className="mb-2 mt-4 flex items-center justify-between">
              <p className="text-xs text-th-fgd-3">Limit Price</p>
            </div>
            <div className="default-transition flex items-center rounded-md border border-th-bkg-4 bg-th-bkg-1 p-3 text-sm font-bold text-th-fgd-1 md:py-2 md:text-lg md:hover:border-th-fgd-4 md:hover:bg-th-bkg-2">
              <NumberFormat
                inputMode="decimal"
                thousandSeparator=","
                allowNegative={false}
                isNumericString={true}
                decimalScale={6}
                name="amountIn"
                id="amountIn"
                className="w-full bg-th-bkg-1 font-mono tracking-tight focus:outline-none"
                placeholder="0.00"
                value={tradeForm.price}
                onValueChange={handlePriceChange}
              />
              <div className="ml-2 text-sm font-normal text-th-fgd-4">
                {quoteSymbol}
              </div>
            </div>
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap px-5">
        {tradeForm.tradeType === 'Limit' ? (
          <div className="mt-4 flex">
            <div className="mr-4 ">
              <Tooltip
                className="hidden md:block"
                delay={250}
                placement="left"
                content={t('tooltip-post')}
              >
                <Checkbox
                  checked={tradeForm.postOnly}
                  onChange={(e) => handlePostOnlyChange(e.target.checked)}
                >
                  Post
                </Checkbox>
              </Tooltip>
            </div>
            <div className="mr-4 ">
              <Tooltip
                className="hidden md:block"
                delay={250}
                placement="top"
                content={t('tooltip-ioc')}
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
        <div className="mt-4">
          <Tooltip
            delay={250}
            placement="left"
            content={t('tooltip-enable-margin')}
          >
            <Checkbox
              checked={useMargin}
              onChange={(e) => setUseMargin(e.target.checked)}
            >
              {t('margin')}
            </Checkbox>
          </Tooltip>
        </div>
      </div>
      <div className="mt-5 flex px-4">
        <Button
          onClick={handlePlaceOrder}
          className={`flex w-full items-center justify-center text-white ${
            tradeForm.side === 'buy'
              ? 'bg-th-green-dark md:hover:bg-th-green'
              : 'bg-th-red-dark md:hover:bg-th-red'
          }`}
          disabled={false}
          size="medium"
        >
          <span className="capitalize">Place {tradeForm.side} Order</span>
        </Button>
      </div>
    </div>
  )
}

export default AdvancedTradeForm
