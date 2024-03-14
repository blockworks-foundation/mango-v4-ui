import { useMemo } from 'react'
import Tooltip from './Tooltip'
import { useTranslation } from 'react-i18next'

const TradePriceDifference = ({
  currentPrice,
  newPrice,
}: {
  currentPrice: number | undefined
  newPrice: number | undefined
}) => {
  const { t } = useTranslation('trade')
  const priceDifference = useMemo(() => {
    if (!currentPrice || !newPrice) return 0
    const difference = ((newPrice - currentPrice) / currentPrice) * 100
    return difference
  }, [currentPrice, newPrice])

  return (
    <Tooltip content={t('tooltip-limit-price-difference')}>
      <p
        className={`tooltip-underline font-mono text-xs ${
          priceDifference >= 0 ? 'text-th-up' : 'text-th-down'
        }`}
      >
        {priceDifference
          ? (priceDifference > 0 ? '+' : '') + priceDifference.toFixed(2)
          : '0.00'}
        %
      </p>
    </Tooltip>
  )
}

export default TradePriceDifference
