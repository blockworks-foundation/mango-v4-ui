import mangoStore from '@store/mangoStore'
import React, { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type DepthData = {
  price: number
  [key: string]: number
  cumulative: number
}

function DepthChart() {
  const orderbook = mangoStore((s) => s.selectedMarket.orderbook)
  const [chartData, setChartData] = useState<DepthData[]>([])
  console.log(orderbook)
  useEffect(() => {
    const bidsCumulative = calculateCumulative(orderbook.bids, 'bids')
    const asksCumulative = calculateCumulative(orderbook.asks, 'asks')

    const mergedData = mergeCumulativeData(bidsCumulative, asksCumulative)
    setChartData(mergedData)
  }, [orderbook])

  const calculateCumulative = (levels: number[][], type: 'bids' | 'asks') => {
    let cumulative = 0
    return levels.map((level) => {
      cumulative += level[1]
      return { price: level[0], [type]: cumulative, cumulative: cumulative }
    })
  }

  const mergeCumulativeData = (bids: DepthData[], asks: DepthData[]) => {
    return [...bids, ...asks].sort((a, b) => a.price - b.price)
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData.slice(40, -40)} layout="vertical">
        <XAxis type="number" />
        <YAxis
          dataKey="price"
          reversed={true}
          domain={['dataMin', 'dataMax']}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="bids"
          stroke="#008000" // Green stroke for bids
          fill="url(#bidsGradient)"
        />
        <Line
          type="monotone"
          dataKey="asks"
          stroke="#FF0000" // Red stroke for asks
          fill="url(#asksGradient)"
        />
        <defs>
          <linearGradient id="bidsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#008000" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#008000" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="asksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF0000" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
          </linearGradient>
        </defs>
      </LineChart>
    </ResponsiveContainer>
  )
}

export default DepthChart
