import { useMemo } from 'react'

const TradePriceDifference = ({
  currentPrice,
  newPrice,
}: {
  currentPrice: number | undefined
  newPrice: number | undefined
}) => {
  const priceDifference = useMemo(() => {
    if (!currentPrice || !newPrice) return 0
    const difference = ((newPrice - currentPrice) / currentPrice) * 100
    return difference
  }, [currentPrice, newPrice])

  return (
    <p
      className={`font-mono text-xs ${
        priceDifference >= 0 ? 'text-th-up' : 'text-th-down'
      }`}
    >
      {priceDifference
        ? (priceDifference > 0 ? '+' : '') + priceDifference.toFixed(2)
        : '0.00'}
      %
    </p>
  )
}

export default TradePriceDifference
