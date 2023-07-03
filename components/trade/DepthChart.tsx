import useOrderbookSubscription, {
  cumOrderbookSide,
} from 'hooks/useOrderbookSubscription'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTheme } from 'next-themes'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { COLORS } from 'styles/colors'
import { getDecimalCount } from 'utils/numbers'

const DepthChart = ({ grouping }: { grouping: number }) => {
  const { theme } = useTheme()
  const { serumOrPerpMarket } = useSelectedMarket()
  const [isScrolled, setIsScrolled] = useState(false)
  const depthChartElRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    setIsScrolled(true)
  }, [])

  const verticallyCenterChart = useCallback(() => {
    const element = depthChartElRef.current
    if (element) {
      if (element.scrollHeight > window.innerHeight) {
        element.scrollTop =
          (element.scrollHeight - element.scrollHeight) / 2 +
          (element.scrollHeight - window.innerHeight) / 2 +
          94
      } else {
        element.scrollTop = (element.scrollHeight - element.offsetHeight) / 2
      }
    }
  }, [])

  const orderbook = useOrderbookSubscription(
    40,
    grouping,
    isScrolled,
    verticallyCenterChart
  )

  const mergeCumulativeData = (
    bids: cumOrderbookSide[],
    asks: cumOrderbookSide[]
  ) => {
    const bidsWithSide = bids.map((b) => ({ ...b, bids: b.cumulativeSize }))
    const asksWithSide = asks.map((a) => ({ ...a, asks: a.cumulativeSize }))
    return [...bidsWithSide, ...asksWithSide].sort((a, b) => a.price - b.price)
  }

  const chartData = useMemo(() => {
    if (!orderbook) return []
    return mergeCumulativeData(orderbook.bids, orderbook.asks)
  }, [orderbook])

  // useEffect(() => {
  //   verticallyCenterChart()
  // }, [])

  useEffect(() => {
    window.addEventListener('resize', verticallyCenterChart)
  }, [verticallyCenterChart])

  // useEffect(() => {
  //   const bidsCumulative = calculateCumulative(orderbook.bids, 'bids')
  //   const asksCumulative = calculateCumulative(orderbook.asks, 'asks')

  //   const mergedData = mergeCumulativeData(bidsCumulative, asksCumulative)
  //   setChartData(mergedData.slice(40, -40))
  // }, [orderbook])

  // const calculateCumulative = (levels: number[][], type: 'bids' | 'asks') => {
  //   let cumulative = 0
  //   return levels.map((level) => {
  //     cumulative += level[1]
  //     return { price: level[0], [type]: cumulative, cumulative: cumulative }
  //   })
  // }

  return (
    <div
      className="hide-scroll relative h-full overflow-y-scroll"
      ref={depthChartElRef}
      onScroll={handleScroll}
    >
      <ResponsiveContainer width="100%" height={2000}>
        <AreaChart data={chartData} layout="vertical">
          <XAxis
            axisLine={false}
            type="number"
            tick={{
              fill: 'var(--fgd-4)',
              fontSize: 10,
            }}
            tickLine={false}
          />
          <YAxis
            dataKey="price"
            reversed={true}
            domain={['dataMin', 'dataMax']}
            tick={{
              fill: 'var(--fgd-4)',
              fontSize: 10,
            }}
            ticks={chartData.map((d) => d.price)}
            tickLine={false}
            tickFormatter={(d) =>
              serumOrPerpMarket
                ? d.toFixed(getDecimalCount(serumOrPerpMarket.tickSize))
                : d
            }
          />
          <Area
            type="step"
            dataKey="bids"
            stroke={COLORS.UP[theme]}
            fill="url(#bidsGradient)"
            isAnimationActive={false}
          />
          <Area
            type="step"
            dataKey="asks"
            stroke={COLORS.DOWN[theme]}
            fill="url(#asksGradient)"
            isAnimationActive={false}
          />
          <defs>
            <linearGradient id="bidsGradient" x1="1" y1="0" x2="0" y2="0">
              <stop
                offset="0%"
                stopColor={COLORS.UP[theme]}
                stopOpacity={0.15}
              />
              <stop offset="99%" stopColor={COLORS.UP[theme]} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="asksGradient" x1="1" y1="0" x2="0" y2="0">
              <stop
                offset="0%"
                stopColor={COLORS.DOWN[theme]}
                stopOpacity={0.15}
              />
              <stop
                offset="99%"
                stopColor={COLORS.DOWN[theme]}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DepthChart
