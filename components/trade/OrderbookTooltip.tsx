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
  const isBuy = side === 'sell'
  const oppositeSide = side === 'buy' ? 'sell' : 'buy'
  const isPerp = serumOrPerpMarket instanceof PerpMarket
  return (
    <div
      className={`absolute left-1/2 top-4 w-full max-w-[75%] -translate-x-1/2 rounded-md border bg-th-bkg-1 p-3 text-center ${
        isBuy ? 'border-th-up' : 'border-th-down'
      }`}
    >
      <p>
        <span className={isBuy ? 'text-th-up' : 'text-th-down'}>
          {t(oppositeSide)}
        </span>
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
