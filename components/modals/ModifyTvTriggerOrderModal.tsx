import { useMemo, useState } from 'react'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'
import Label from '@components/forms/Label'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import { INPUT_CLASSES } from './TradeVolumeAlertModal'
import {
  PerpMarket,
  TokenConditionalSwap,
} from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import Button, { LinkButton } from '@components/shared/Button'
import useSelectedMarket from 'hooks/useSelectedMarket'
import {
  floorToDecimal,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import InlineNotification from '@components/shared/InlineNotification'
import MarketLogos from '@components/trade/MarketLogos'
import SideBadge from '@components/shared/SideBadge'
import { ArrowRightIcon } from '@heroicons/react/20/solid'
import MaxAmountButton from '@components/shared/MaxAmountButton'

interface ModifyModalProps {
  order: TokenConditionalSwap
  price: string
}

type ModalCombinedProps = ModifyModalProps & ModalProps

const ModifyTvTriggerOrderModal = ({
  isOpen,
  onClose,
  order,
  price,
}: ModalCombinedProps) => {
  const { t } = useTranslation(['common', 'trade'])
  const [modifiedOrderPrice, setModifiedOrderPrice] = useState(price)
  const [modifiedOrderSize, setModifiedOrderSize] = useState('')
  const { baseSymbol, selectedMarket, serumOrPerpMarket } = useSelectedMarket()

  const [buyBank, sellBank] = useMemo(() => {
    const { group } = mangoStore.getState()
    if (!group) return [undefined, undefined]
    const buyBank = group.getFirstBankByTokenIndex(order.buyTokenIndex)
    const sellBank = group.getFirstBankByTokenIndex(order.sellTokenIndex)
    return [buyBank, sellBank]
  }, [order])

  const [side, size, currentOrderPrice] = useMemo(() => {
    const { group } = mangoStore.getState()
    if (!group || !buyBank || !sellBank) return ['buy', 0, 0]
    const maxBuy = floorToDecimal(
      order.getMaxBuyUi(group),
      buyBank.mintDecimals,
    ).toNumber()
    const maxSell = floorToDecimal(
      order.getMaxSellUi(group),
      sellBank.mintDecimals,
    ).toNumber()
    let side: string
    let size: number
    if (maxBuy === 0 || maxBuy > maxSell) {
      size = maxSell
      side = 'sell'
    } else {
      size = maxBuy
      side = 'buy'
    }
    const price = order.getThresholdPriceUi(group)
    return [side, size, price]
  }, [buyBank, order, sellBank])

  const orderType = useMemo(() => {
    if (
      !selectedMarket ||
      selectedMarket instanceof PerpMarket ||
      !buyBank ||
      !sellBank
    )
      return
    const baseBank =
      selectedMarket.baseTokenIndex === buyBank.tokenIndex ? buyBank : sellBank
    const quoteBank =
      selectedMarket.quoteTokenIndex === buyBank.tokenIndex ? buyBank : sellBank
    const currentPrice = baseBank.uiPrice / quoteBank.uiPrice
    const isReducingShort = side.toLowerCase() === 'buy'
    const orderType =
      (isReducingShort && parseFloat(modifiedOrderPrice) > currentPrice) ||
      (!isReducingShort && parseFloat(modifiedOrderPrice) < currentPrice)
        ? t('trade:stop-loss')
        : t('trade:take-profit')
    return orderType
  }, [buyBank, modifiedOrderPrice, selectedMarket, sellBank, side])

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

  const max = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!buyBank || !sellBank || !mangoAccount) return 0
    let max = 0
    const positionBank = side === 'buy' ? buyBank : sellBank
    const balance = mangoAccount.getTokenBalanceUi(positionBank)
    const roundedBalance = floorToDecimal(balance, minOrderDecimals).toNumber()
    if (side === 'buy') {
      max = roundedBalance < 0 ? roundedBalance : 0
    } else {
      max = roundedBalance > 0 ? roundedBalance : 0
    }
    return max
  }, [buyBank, sellBank, side, minOrderDecimals])

  // const modifyOrder = useCallback(
  //   async (order: TokenConditionalSwap) => {
  //   },
  //   [],
  // )

  return selectedMarket ? (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-2 text-center">{t('trade:edit-trigger-order')}</h2>
      <div className="mb-4 flex items-center justify-center">
        <MarketLogos market={selectedMarket} />
        <p className="mr-2 font-bold text-th-fgd-1">{selectedMarket.name}</p>
      </div>
      <div className="mb-4">
        <Label text={t('trade:trigger-price')} />
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
          <MaxAmountButton
            decimals={minOrderDecimals}
            label={t('trade:position')}
            onClick={() => setModifiedOrderSize(max.toString())}
            value={max}
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
          value={modifiedOrderSize || size}
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
          <SideBadge side={side} />
        </div>
        <div className="flex justify-between">
          <p>{t('trade:order-type')}</p>
          <p className="text-th-fgd-2">{orderType}</p>
        </div>
        <div className="flex justify-between">
          <p>{t('trade:trigger-price')}</p>
          <div className="flex items-center space-x-2">
            <p className="font-mono text-th-fgd-2">
              {formatNumericValue(currentOrderPrice, tickDecimals)}
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
            {modifiedOrderSize && size !== parseFloat(modifiedOrderSize) ? (
              <>
                <p className="font-mono text-th-fgd-2">{size}</p>
                <ArrowRightIcon className="h-4 w-4 text-th-fgd-3" />
              </>
            ) : null}
            <p className="font-mono text-th-fgd-2">
              {formatNumericValue(modifiedOrderSize || size, minOrderDecimals)}
            </p>
          </div>
        </div>
      </div>
      <Button
        className="mb-4 w-full"
        size="large"
        // onClick={() => modifyOrder(order)}
      >
        {t('confirm')}
      </Button>
      <LinkButton className="mx-auto" onClick={onClose}>
        {t('cancel')}
      </LinkButton>
    </Modal>
  ) : null
}

export default ModifyTvTriggerOrderModal
