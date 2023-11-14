import LiquidationsAtRiskChart from './LiquidationsAtRiskChart'
import PerpLiquidationsChart from './PerpLiquidationsChart'
import TokenLiquidationsChart from './TokenLiquidationsChart'

const LiquidationsCharts = () => {
  return (
    <>
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1">
        <LiquidationsAtRiskChart />
      </div>
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:border-r">
        <TokenLiquidationsChart />
      </div>
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:pl-6">
        <PerpLiquidationsChart />
      </div>
    </>
  )
}

export default LiquidationsCharts
