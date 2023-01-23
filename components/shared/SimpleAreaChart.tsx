import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

const SimpleAreaChart = ({
  color,
  data,
  name,
  xKey,
  yKey,
}: {
  color: string
  data: any[]
  name: string
  xKey: string
  yKey: string
}) => {
  const flipGradientCoords = useMemo(() => {
    if (!data.length) return
    return data[0][yKey] <= 0 && data[data.length - 1][yKey] <= 0
  }, [data])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient
            id={`gradientArea-${name}`}
            x1="0"
            y1={flipGradientCoords ? '0' : '1'}
            x2="0"
            y2={flipGradientCoords ? '1' : '0'}
          >
            <stop offset="0%" stopColor={color} stopOpacity={0} />
            <stop offset="100%" stopColor={color} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          fill={`url(#gradientArea-${name})`}
        />
        <XAxis dataKey={xKey} hide />
        <YAxis
          domain={([dataMin, dataMax]) => {
            const absMax = Math.max(Math.abs(dataMin), Math.abs(dataMax))
            if (absMax < 1) {
              return [dataMin - 0.01, dataMax + 0.01]
            } else {
              return [dataMin, dataMax]
            }
          }}
          dataKey={yKey}
          hide
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default SimpleAreaChart
