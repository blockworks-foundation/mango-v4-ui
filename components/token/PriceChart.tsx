import { formatDateAxis } from '@components/shared/DetailedAreaOrBarChart'
import dayjs from 'dayjs'
import { BirdeyePriceResponse } from 'hooks/useBirdeyeMarketPrices'
import useThemeWrapper from 'hooks/useThemeWrapper'
import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { COLORS } from 'styles/colors'
import { formatCurrencyValue } from 'utils/numbers'

const PriceChart = ({
  prices,
  daysToShow,
}: {
  prices: BirdeyePriceResponse[]
  daysToShow: number
}) => {
  const { theme } = useThemeWrapper()

  const change = useMemo(() => {
    return prices[prices.length - 1].value - prices[0].value
  }, [prices])

  return (
    <div className="relative -mt-1 h-72 w-auto md:h-96">
      <div className="mt-6 h-full">
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
              dataKey="value"
              stroke={change >= 0 ? COLORS.UP[theme] : COLORS.DOWN[theme]}
              strokeWidth={1.5}
              fill="url(#gradientArea)"
            />
            <XAxis
              axisLine={false}
              dataKey="unixTime"
              minTickGap={20}
              padding={{ left: 20, right: 20 }}
              tick={{
                fill: 'var(--fgd-4)',
                fontSize: 10,
              }}
              tickLine={false}
              tickFormatter={(d) =>
                formatDateAxis(dayjs(d * 1000).toISOString(), daysToShow)
              }
            />
            <YAxis
              axisLine={false}
              dataKey="value"
              type="number"
              domain={['dataMin', 'dataMax']}
              padding={{ top: 20, bottom: 20 }}
              tick={{
                fill: 'var(--fgd-4)',
                fontSize: 10,
              }}
              tickFormatter={(x) => formatCurrencyValue(x)}
              tickLine={false}
              width={prices[0].value < 0.00001 ? 100 : 60}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PriceChart
