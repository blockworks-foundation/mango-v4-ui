import { PerpMarket } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumericValue, getDecimalCount } from 'utils/numbers'

const OrderbookTooltip = () => {
  const { t } = useTranslation(['common', 'trade'])
  const orderbookTooltip = mangoStore((s) => s.orderbookTooltip)
  const { serumOrPerpMarket, baseSymbol, quoteSymbol } = useSelectedMarket()

  const [minOrderDecimals, tickDecimals] = useMemo(() => {
    if (!serumOrPerpMarket) return [0, 0]
    return [
      getDecimalCount(serumOrPerpMarket.minOrderSize),
      getDecimalCount(serumOrPerpMarket.tickSize),
    ]
  }, [serumOrPerpMarket])

  if (!orderbookTooltip) return null

  const { averagePrice, cumulativeSize, cumulativeValue, side } =
    orderbookTooltip
  const isBid = side === 'buy'
  const isPerp = serumOrPerpMarket instanceof PerpMarket
  return (
    <div
      className={`absolute top-4 left-1/2 -translate-x-1/2 p-3 rounded-md bg-th-bkg-1 border text-center ${
        isBid ? 'border-th-up' : 'border-th-down'
      }`}
    >
      <p className="whitespace-nowrap">
        <span className={isBid ? 'text-th-up' : 'text-th-down'}>{t(side)}</span>
        {` ${formatNumericValue(cumulativeSize, minOrderDecimals)} ${
          isPerp ? '' : baseSymbol
        } ${t('trade:for')} ${isPerp ? '$' : ''}${formatNumericValue(
          cumulativeValue,
          tickDecimals,
        )} ${isPerp ? '' : quoteSymbol} ${t('trade:average-price-of')} ${
          isPerp ? '$' : ''
        }${formatNumericValue(averagePrice, tickDecimals)} ${
          isPerp ? '' : quoteSymbol
        }`}
      </p>
    </div>
  )
}

export default OrderbookTooltip
