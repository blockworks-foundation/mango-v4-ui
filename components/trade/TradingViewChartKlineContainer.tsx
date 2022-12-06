import { useState } from 'react'
import { createPortal } from 'react-dom'
import TradingViewChartKline from './TradingViewChartKline'

const TradingViewChartKlineContainer = () => {
  const [isFullView, setIsFullView] = useState<boolean>(false)
  return (
    <>
      {isFullView ? (
        createPortal(
          <TradingViewChartKline
            setIsFullView={setIsFullView}
            isFullView={isFullView}
          ></TradingViewChartKline>,
          document.body
        )
      ) : (
        <TradingViewChartKline
          setIsFullView={setIsFullView}
          isFullView={isFullView}
        ></TradingViewChartKline>
      )}
    </>
  )
}

export default TradingViewChartKlineContainer
