import SwapForm from './SwapForm'
import mangoStore from '@store/mangoStore'
import SwapOnboardingTour from '@components/tours/SwapOnboardingTour'
import { useWallet } from '@solana/wallet-adapter-react'
import SwapInfoTabs from './SwapInfoTabs'
import dynamic from 'next/dynamic'
const SwapTokenChart = dynamic(() => import('./SwapTokenChart'), { ssr: false })

const SwapPage = () => {
  const inputTokenInfo = mangoStore((s) => s.swap.inputTokenInfo)
  const outputTokenInfo = mangoStore((s) => s.swap.outputTokenInfo)
  const { connected } = useWallet()
  const tourSettings = mangoStore((s) => s.settings.tours)

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 border-th-bkg-3 md:col-span-6 md:border-b lg:col-span-7 xl:col-span-8">
          {inputTokenInfo?.address && outputTokenInfo?.address ? (
            <SwapTokenChart
              inputMint={inputTokenInfo.address}
              outputMint={outputTokenInfo.address}
            />
          ) : null}
        </div>
        <div className="col-span-12 mt-2 space-y-6 border-th-bkg-3 md:col-span-6 md:mt-0 md:border-b lg:col-span-5 xl:col-span-4">
          <SwapForm />
        </div>
        <div className="col-span-12">
          <SwapInfoTabs />
        </div>
      </div>
      {!tourSettings?.swap_tour_seen && connected ? (
        <SwapOnboardingTour />
      ) : null}
    </>
  )
}

export default SwapPage
