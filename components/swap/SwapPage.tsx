import Swap from './SwapForm'
import SwapTokenChart from './SwapTokenChart'
import mangoStore from '@store/mangoStore'
import AccountTabs from '../account/AccountTabs'
import SwapOnboardingTour from '@components/tours/SwapOnboardingTour'
import { useWallet } from '@solana/wallet-adapter-react'

const SwapPage = () => {
  const inputTokenInfo = mangoStore((s) => s.swap.inputTokenInfo)
  const outputTokenInfo = mangoStore((s) => s.swap.outputTokenInfo)
  const { connected } = useWallet()
  const userSettings = mangoStore((s) => s.settings.current)
  const loadingUserSettings = mangoStore((s) => s.settings.loading)

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 border-th-bkg-3 md:col-span-6 md:border-b lg:col-span-8">
          <SwapTokenChart
            inputTokenId={inputTokenInfo?.extensions?.coingeckoId}
            outputTokenId={outputTokenInfo?.extensions?.coingeckoId}
          />
        </div>
        <div className="col-span-12 mt-2 space-y-6 border-th-bkg-3 md:col-span-6 md:mt-0 md:border-b lg:col-span-4">
          <Swap />
        </div>
        <div className="col-span-12">
          <AccountTabs />
        </div>
      </div>
      {!userSettings?.swap_tour_seen && !loadingUserSettings && connected ? (
        <SwapOnboardingTour />
      ) : null}
    </>
  )
}

export default SwapPage
