import { formatDateAxis } from '@components/shared/DetailedAreaChart'
import { BirdeyePrice } from '@store/mangoStore'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { COLORS } from 'styles/colors'

const PriceChart = ({
  prices,
  daysToShow,
}: {
  prices: BirdeyePrice[]
  daysToShow: number
}) => {
  const { theme } = useTheme()

  const change = useMemo(() => {
    return prices[prices.length - 1].value - prices[0].value
  }, [prices])

  return (
    <div className="relative -mt-1 h-96 w-auto">
      <div className="-mx-6 mt-6 h-full px-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={prices}>
            <defs>
              <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={
                    change >= 0 ? COLORS.GREEN[theme] : COLORS.RED[theme]
                  }
                  stopOpacity={0.15}
                />
                <stop
                  offset="99%"
                  stopColor={
                    change >= 0 ? COLORS.GREEN[theme] : COLORS.RED[theme]
                  }
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="value"
              stroke={change >= 0 ? COLORS.GREEN[theme] : COLORS.RED[theme]}
              strokeWidth={1.5}
              fill="url(#gradientArea)"
            />
            <XAxis
              axisLine={false}
              dataKey="unixTime"
              padding={{ left: 20, right: 20 }}
              tick={{
                fill:
                  theme === 'Light'
                    ? 'rgba(0,0,0,0.4)'
                    : 'rgba(255,255,255,0.6)',
                fontSize: 10,
              }}
              interval={10}
              tickLine={false}
              tickFormatter={(d) => formatDateAxis(d * 1000, daysToShow)}
            />
            <YAxis
              axisLine={false}
              dataKey={'value'}
              type="number"
              domain={['dataMin', 'dataMax']}
              padding={{ top: 20, bottom: 20 }}
              tick={{
                fill:
                  theme === 'Light'
                    ? 'rgba(0,0,0,0.4)'
                    : 'rgba(255,255,255,0.6)',
                fontSize: 10,
              }}
              tickFormatter={(x) => `$${x.toFixed(2)}`}
              tickLine={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PriceChart
