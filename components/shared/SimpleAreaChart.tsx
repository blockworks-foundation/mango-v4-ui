import { useMemo } from 'react'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'

const SimpleAreaChart = ({
  color,
  data,
  height,
  name,
  width,
  xKey,
  yKey,
}: {
  color: string
  data: any[]
  height: number
  name: string
  width: number
  xKey: string
  yKey: string
}) => {
  const flipGradientCoords = useMemo(
    () => data[0][yKey] <= 0 && data[data.length - 1][yKey] < data[0][yKey],
    [data]
  )

  return (
    <AreaChart width={width} height={height} data={data}>
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
        isAnimationActive={false}
        type="monotone"
        dataKey={yKey}
        stroke={color}
        fill={`url(#gradientArea-${name})`}
      />
      <XAxis dataKey={xKey} hide />
      <YAxis domain={['dataMin', 'dataMax']} dataKey={yKey} hide />
    </AreaChart>
  )
}

export default SimpleAreaChart
