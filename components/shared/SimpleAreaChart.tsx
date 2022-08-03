import { Area, AreaChart, XAxis, YAxis } from 'recharts'

const SimpleAreaChart = ({
  color,
  data,
  height,
  name,
  width,
}: {
  color: string
  data: any[]
  height: number
  name: string
  width: number
}) => {
  return (
    <AreaChart width={width} height={height} data={data}>
      <defs>
        <linearGradient id={`gradientArea-${name}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.6} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        isAnimationActive={false}
        type="monotone"
        dataKey="1"
        stroke={color}
        fill={`url(#gradientArea-${name})`}
      />
      <XAxis dataKey="0" hide />
      <YAxis domain={['dataMin', 'dataMax']} dataKey="1" hide />
    </AreaChart>
  )
}

export default SimpleAreaChart
