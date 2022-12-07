import { formatDateAxis } from '@components/shared/DetailedAreaChart'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { COLORS } from 'styles/colors'

const PriceChart = ({
  prices,
  daysToShow,
}: {
  prices: number[][]
  daysToShow: number
}) => {
  const { theme } = useTheme()

  const change = useMemo(() => {
    return prices[prices.length - 1][1] - prices[0][1]
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
                    change >= 0 ? COLORS.UP[theme] : COLORS.DOWN[theme]
                  }
                  stopOpacity={0.15}
                />
                <stop
                  offset="99%"
                  stopColor={
                    change >= 0 ? COLORS.UP[theme] : COLORS.DOWN[theme]
                  }
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="1"
              stroke={change >= 0 ? COLORS.UP[theme] : COLORS.DOWN[theme]}
              strokeWidth={1.5}
              fill="url(#gradientArea)"
            />
            <XAxis
              axisLine={false}
              dataKey="0"
              minTickGap={20}
              padding={{ left: 20, right: 20 }}
              tick={{
                fill: 'var(--fgd-4)',
                fontSize: 10,
              }}
              tickLine={false}
              tickFormatter={(d) => formatDateAxis(d, daysToShow)}
            />
            <YAxis
              axisLine={false}
              dataKey={'1'}
              type="number"
              domain={['dataMin', 'dataMax']}
              padding={{ top: 20, bottom: 20 }}
              tick={{
                fill: 'var(--fgd-4)',
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
