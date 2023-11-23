import LiquidationsAtRiskChart from './LiquidationsAtRiskChart'
import PerpLiquidationsChart from './PerpLiquidationsChart'
import TokenLiquidationsChart from './TokenLiquidationsChart'

const Liquidations = () => {
  return (
    <>
      <h2 className="my-4 px-6 text-lg">Liquidations</h2>
      <div className="grid grid-cols-2 border-t border-th-bkg-3">
        <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:border-r">
          <TokenLiquidationsChart />
        </div>
        <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:pl-6">
          <PerpLiquidationsChart />
        </div>
        <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4">
          <LiquidationsAtRiskChart />
        </div>
      </div>
    </>
  )
}

export default Liquidations
