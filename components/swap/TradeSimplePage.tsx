import Swap from './SwapForm'
import SwapTokenChart from './SwapTokenChart'
import mangoStore from '@store/mangoStore'
import AccountTabs from '../account/AccountTabs'

const TradeSimplePage = () => {
  const inputTokenInfo = mangoStore((s) => s.swap.inputTokenInfo)
  const outputTokenInfo = mangoStore((s) => s.swap.outputTokenInfo)

  return (
    <div className="grid grid-cols-12 gap-x-6">
      <div className="col-span-12 mb-8 md:col-span-6 md:mb-0 lg:col-span-8">
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
