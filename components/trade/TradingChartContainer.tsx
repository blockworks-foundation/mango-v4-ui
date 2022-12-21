import useLocalStorageState from 'hooks/useLocalStorageState'
import dynamic from 'next/dynamic'
import { TRADE_CHART_UI_KEY } from 'utils/constants'

const TradingViewChart = dynamic(() => import('./TradingViewChart'), {
  ssr: false,
})

const TradingViewChartKlineContainer = dynamic(
  () => import('./TradingViewChartKlineContainer'),
  {
    ssr: false,
  }
)

const TradingChartContainer = () => {
  const [tradingChart] = useLocalStorageState(TRADE_CHART_UI_KEY)
  const isTradingChart = tradingChart === 'Original'
  return !isTradingChart ? (
    <TradingViewChart></TradingViewChart>
  ) : (
    <TradingViewChartKlineContainer></TradingViewChartKlineContainer>
  )
}

export default TradingChartContainer
