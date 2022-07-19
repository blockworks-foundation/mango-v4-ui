import TokenList from './TokenList'
import Swap from './swap/Swap'
import SwapTokenChart from './swap/SwapTokenChart'
import mangoStore from '../store/state'
// import MangoAccount from './account/MangoAccount'

const TradeSimplePage = () => {
  const inputTokenInfo = mangoStore((s) => s.inputTokenInfo)
  const outputTokenInfo = mangoStore((s) => s.outputTokenInfo)

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 space-y-12 md:col-span-6 lg:col-span-8">
        <SwapTokenChart
          inputTokenId={inputTokenInfo?.extensions?.coingeckoId}
          outputTokenId={outputTokenInfo?.extensions?.coingeckoId}
        />
      </div>
      <div className="col-span-12 space-y-6 md:col-span-6 lg:col-span-4">
        <Swap />
        {/* <MangoAccount /> */}
      </div>
      <div className="col-span-12">
        <TokenList />
      </div>
    </div>
  )
}

export default TradeSimplePage
