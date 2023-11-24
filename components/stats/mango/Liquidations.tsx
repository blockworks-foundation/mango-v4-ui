import LiquidationsAtRiskChart from './LiquidationsAtRiskChart'
import PerpLiquidationsChart from './PerpLiquidationsChart'
import TokenLiquidationsChart from './TokenLiquidationsChart'

const Liquidations = () => {
  return (
    <>
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 lg:py-6">
        <TokenLiquidationsChart />
      </div>
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:pl-6 lg:py-6">
        <PerpLiquidationsChart />
      </div>
      <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 lg:py-6">
        <LiquidationsAtRiskChart />
      </div>
    </>
  )
}

export default Liquidations
