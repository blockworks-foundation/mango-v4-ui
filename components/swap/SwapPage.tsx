import Swap from './SwapForm'
import SwapTokenChart from './SwapTokenChart'
import mangoStore from '@store/mangoStore'
import AccountTabs from '../account/AccountTabs'

const SwapPage = () => {
  const inputTokenInfo = mangoStore((s) => s.swap.inputTokenInfo)
  const outputTokenInfo = mangoStore((s) => s.swap.outputTokenInfo)

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 mb-8 border-th-bkg-3 md:col-span-6 md:mb-0 md:border-b lg:col-span-8">
        <SwapTokenChart
          inputTokenId={inputTokenInfo?.extensions?.coingeckoId}
          outputTokenId={outputTokenInfo?.extensions?.coingeckoId}
        />
      </div>
      <div className="col-span-12 mt-2 space-y-6 border-th-bkg-3 md:col-span-6 md:mt-0 md:border-b lg:col-span-4">
        <Swap />
      </div>
      <div className="col-span-12 mt-6 md:mt-0">
        <AccountTabs />
      </div>
    </div>
  )
}

export default SwapPage
