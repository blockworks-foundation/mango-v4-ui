import dynamic from 'next/dynamic'

const TradingViewChart = dynamic(() => import('./TradingViewChart'), {
  ssr: false,
})

const TradingChartContainer = () => {
  return <TradingViewChart></TradingViewChart>
}

export default TradingChartContainer
