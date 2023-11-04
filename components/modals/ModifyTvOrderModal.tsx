import { useCallback, useMemo, useState } from 'react'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'
import Label from '@components/forms/Label'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import { INPUT_CLASSES } from './TradeVolumeAlertModal'
import { Order } from '@project-serum/serum/lib/market'
import {
  PerpOrder,
  PerpOrderType,
  Serum3OrderType,
  Serum3SelfTradeBehavior,
  Serum3Side,
} from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { PublicKey } from '@solana/web3.js'
import { notify } from 'utils/notifications'
import { isMangoError } from 'types'
import Button, { LinkButton } from '@components/shared/Button'
import { findSerum3MarketPkInOpenOrders } from '@components/trade/OpenOrders'
import useSelectedMarket from 'hooks/useSelectedMarket'
import {
  floorToDecimal,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { TRADE_CHECKBOXES_KEY } from 'utils/constants'
import { DEFAULT_CHECKBOX_SETTINGS } from '@components/trade/AdvancedTradeForm'
import MaxSizeButton from '@components/trade/MaxSizeButton'
import InlineNotification from '@components/shared/InlineNotification'
import MarketLogos from '@components/trade/MarketLogos'
import PerpSideBadge from '@components/trade/PerpSideBadge'
import SideBadge from '@components/shared/SideBadge'
import { ArrowRightIcon } from '@heroicons/react/20/solid'

interface ModifyModalProps {
  order: Order | PerpOrder
  price: string
}

type ModalCombinedProps = ModifyModalProps & ModalProps

const ModifyTvOrderModal = ({
  isOpen,
  onClose,
  order,
  price,
}: ModalCombinedProps) => {
  const { t } = useTranslation(['common', 'trade'])
  const [modifiedOrderPrice, setModifiedOrderPrice] = useState(price)
  const [modifiedOrderSize, setModifiedOrderSize] = useState(
    order.size.toString(),
  )
  const { baseSymbol, selectedMarket, serumOrPerpMarket } = useSelectedMarket()
  const [savedCheckboxSettings] = useLocalStorageState(
    TRADE_CHECKBOXES_KEY,
    DEFAULT_CHECKBOX_SETTINGS,
  )

  const tickDecimals = useMemo(() => {
    if (!serumOrPerpMarket) return 1
    const tickSize = serumOrPerpMarket.tickSize
    const tickDecimals = getDecimalCount(tickSize)
    return tickDecimals
  }, [serumOrPerpMarket])

  const [minOrderDecimals, minOrderSize] = useMemo(() => {
    if (!serumOrPerpMarket) return [1, 0.1]
    const minOrderSize = serumOrPerpMarket.minOrderSize
    const minOrderDecimals = getDecimalCount(minOrderSize)
    return [minOrderDecimals, minOrderSize]
  }, [serumOrPerpMarket])

  const modifyOrder = useCallback(
    async (o: PerpOrder | Order) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const actions = mangoStore.getState().actions
      const baseSize = modifiedOrderSize ? Number(modifiedOrderSize) : o.size
      const price = modifiedOrderPrice
        ? floorToDecimal(modifiedOrderPrice, tickDecimals).toNumber()
        : o.price
      if (!group || !mangoAccount) return
      try {
        let tx
        if (o instanceof PerpOrder) {
          tx = await client.modifyPerpOrder(
            group,
            mangoAccount,
            o.perpMarketIndex,
            o.orderId,
            o.side,
            price,
            Math.abs(baseSize),
            undefined, // maxQuoteQuantity
            Date.now(),
            PerpOrderType.limit,
            undefined,
            undefined,
          )
        } else {
          const marketPk = findSerum3MarketPkInOpenOrders(o)
          if (!marketPk) return
          const market = group.getSerum3MarketByExternalMarket(
            new PublicKey(marketPk),
          )
          tx = await client.modifySerum3Order(
            group,
            o.orderId,
            mangoAccount,
            market.serumMarketExternal,
            o.side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
            price,
            baseSize,
            Serum3SelfTradeBehavior.decrementTake,
            Serum3OrderType.limit,
            Date.now(),
            10,
          )
        }
        actions.fetchOpenOrders()
        notify({
          type: 'success',
          title: 'Transaction successful',
          txid: tx.signature,
        })
        onClose()
      } catch (e) {
        console.error('Error canceling', e)
        if (!isMangoError(e)) return
        notify({
          title: 'Unable to modify order',
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    },
    [
      findSerum3MarketPkInOpenOrders,
      modifiedOrderPrice,
      modifiedOrderSize,
      tickDecimals,
    ],
  )

  return selectedMarket ? (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-2 text-center">{t('trade:edit-order')}</h2>
      <div className="mb-4 flex items-center justify-center">
        <MarketLogos market={selectedMarket} />
        <p className="mr-2 font-bold text-th-fgd-1">{selectedMarket.name}</p>
      </div>
      <div className="mb-4">
        <Label text={t('trade:limit-price')} />
        <NumberFormat
          name="price"
          id="price"
          inputMode="numeric"
          thousandSeparator=","
          allowNegative={false}
          isNumericString={true}
          className={INPUT_CLASSES}
          value={modifiedOrderPrice}
          onValueChange={(e: NumberFormatValues) =>
            setModifiedOrderPrice(e.value)
          }
        />
      </div>
      <div className="mb-6">
        <div className="mb-2 mt-3 flex items-center justify-between">
          <p className="text-th-fgd-3">{t('trade:size')}</p>
          <MaxSizeButton
            minOrderDecimals={minOrderDecimals}
            tickDecimals={tickDecimals}
            useMargin={savedCheckboxSettings.margin}
            large
          />
        </div>
        <NumberFormat
          name="size"
          id="size"
          inputMode="numeric"
          thousandSeparator=","
          allowNegative={false}
          isNumericString={true}
          className={INPUT_CLASSES}
          value={modifiedOrderSize}
          onValueChange={(e: NumberFormatValues) =>
            setModifiedOrderSize(e.value)
          }
        />
        {minOrderSize &&
        modifiedOrderSize &&
        parseFloat(modifiedOrderSize) < minOrderSize ? (
          <div className="mt-1">
            <InlineNotification
              type="error"
              desc={t('trade:min-order-size-error', {
                minSize: minOrderSize,
                symbol: baseSymbol,
              })}
              hideBorder
              hidePadding
            />
          </div>
        ) : null}
      </div>
      <div className="my-6 space-y-1.5 border-y border-th-bkg-3 px-2 py-4">
        <div className="flex justify-between">
          <p>{t('trade:side')}</p>
          {order instanceof PerpOrder ? (
            <PerpSideBadge basePosition={'bid' in order.side ? 1 : -1} />
          ) : (
            <SideBadge side={order.side} />
          )}
        </div>
        <div className="flex justify-between">
          <p>{t('trade:order-type')}</p>
          <p className="text-th-fgd-2">{t('trade:limit')}</p>
        </div>
        <div className="flex justify-between">
          <p>{t('trade:limit-price')}</p>
          <div className="flex items-center space-x-2">
            <p className="font-mono text-th-fgd-2">
              {formatNumericValue(order.price, tickDecimals)}
            </p>
            <ArrowRightIcon className="h-4 w-4 text-th-fgd-3" />
            <p className="font-mono text-th-fgd-2">
              {formatNumericValue(modifiedOrderPrice, tickDecimals)}
            </p>
          </div>
        </div>
        <div className="flex justify-between">
          <p>{t('trade:size')}</p>
          <div className="flex items-center space-x-2">
            {order.size !== parseFloat(modifiedOrderSize) ? (
              <>
                <p className="font-mono text-th-fgd-2">{order.size}</p>
                <ArrowRightIcon className="h-4 w-4 text-th-fgd-3" />
              </>
            ) : null}
            <p className="font-mono text-th-fgd-2">
              {formatNumericValue(modifiedOrderSize, minOrderDecimals)}
            </p>
          </div>
        </div>
      </div>
      <Button
        className="mb-4 w-full"
        size="large"
        onClick={() => modifyOrder(order)}
      >
        {t('confirm')}
      </Button>
      <LinkButton className="mx-auto" onClick={onClose}>
        {t('cancel')}
      </LinkButton>
    </Modal>
  ) : null
}

export default ModifyTvOrderModal
