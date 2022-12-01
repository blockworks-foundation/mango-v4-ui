import { useTheme } from 'next-themes'
import { COLORS } from 'styles/colors'

const OrderbookIcon = ({
  side,
  className,
}: {
  side: 'buy' | 'sell'
  className?: string
}) => {
  const { theme } = useTheme()
  const oppositeSideColor =
    theme === 'Light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'
  const buyColor = side === 'buy' ? COLORS.UP[theme] : oppositeSideColor
  const sellColor = side === 'sell' ? COLORS.DOWN[theme] : oppositeSideColor
  return (
    <svg
      className={`${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="8" height="2" fill={buyColor} />
      <rect x="3" y="11" width="8" height="2" fill={buyColor} />
      <rect x="3" y="7" width="8" height="2" fill={buyColor} />
      <rect x="3" y="15" width="8" height="2" fill={buyColor} />
      <rect x="3" y="19" width="8" height="2" fill={buyColor} />
      <rect x="13" y="3" width="8" height="2" fill={sellColor} />
      <rect x="13" y="11" width="8" height="2" fill={sellColor} />
      <rect x="13" y="7" width="8" height="2" fill={sellColor} />
      <rect x="13" y="15" width="8" height="2" fill={sellColor} />
      <rect x="13" y="19" width="8" height="2" fill={sellColor} />
    </svg>
  )
}

export default OrderbookIcon
