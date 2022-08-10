import Swap from './swap/Swap'
import SwapTokenChart from './swap/SwapTokenChart'
import mangoStore from '../store/state'
import AccountTabs from './account/AccountTabs'

const TradeSimplePage = () => {
  const inputTokenInfo = mangoStore((s) => s.swap.inputTokenInfo)
  const outputTokenInfo = mangoStore((s) => s.swap.outputTokenInfo)

  return (
    <div className="grid grid-cols-12 gap-x-6 gap-y-8">
      <div className="col-span-12 space-y-12 md:col-span-6 lg:col-span-8">
        <SwapTokenChart
          inputTokenId={inputTokenInfo?.extensions?.coingeckoId}
          outputTokenId={outputTokenInfo?.extensions?.coingeckoId}
        />
      </div>
      <div className="col-span-12 space-y-6 md:col-span-6 lg:col-span-4">
        <Swap />
      </div>
      <div className="col-span-12">
        <AccountTabs />
      </div>
    </div>
  )
}

export default TradeSimplePage
