import SwapForm from './SwapForm'
// import mangoStore from '@store/mangoStore'
// import SwapOnboardingTour from '@components/tours/SwapOnboardingTour'
// import { useWallet } from '@solana/wallet-adapter-react'
import SwapInfoTabs from './SwapInfoTabs'
import SwapIntroModal from '@components/modals/SwapIntroModal'
import { useLocalStorage } from '@solana/wallet-adapter-react'
import { SHOW_SWAP_INTRO_MODAL } from 'utils/constants'
import { useEffect } from 'react'
import useMangoAccount from 'hooks/useMangoAccount'
import mangoStore from '@store/mangoStore'
// import useLocalStorageState from 'hooks/useLocalStorageState'
// import { IS_ONBOARDED_KEY } from 'utils/constants'
import SwapTokenChart from './SwapTokenChart'
import FavoriteSwapsBar from './FavoriteSwapsBar'

const SwapPage = () => {
  const { mangoAccountAddress } = useMangoAccount()
  const initialLoad = mangoStore((s) => s.mangoAccount.swapHistory.initialLoad)
  const actions = mangoStore((s) => s.actions)
  const [showSwapIntro, setShowSwapIntro] = useLocalStorage(
    SHOW_SWAP_INTRO_MODAL,
    true,
  )

  useEffect(() => {
    if (mangoAccountAddress && initialLoad) {
      actions.fetchSwapHistory(mangoAccountAddress)
    }
  }, [actions, initialLoad, mangoAccountAddress])
  // const { connected } = useWallet()
  // const tourSettings = mangoStore((s) => s.settings.tours)
  // const [isOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12">
          <FavoriteSwapsBar />
        </div>
        <div className="col-span-12 border-th-bkg-3 md:col-span-6 md:border-b lg:col-span-7 xl:col-span-8">
          <SwapTokenChart />
        </div>
        <div className="col-span-12 mt-2 space-y-6 border-th-bkg-3 md:col-span-6 md:mt-0 md:border-b lg:col-span-5 xl:col-span-4">
          <SwapForm />
        </div>
        <div className="col-span-12">
          <SwapInfoTabs />
        </div>
      </div>
      {showSwapIntro ? (
        <SwapIntroModal
          isOpen={showSwapIntro}
          onClose={() => setShowSwapIntro(false)}
        />
      ) : null}
    </>
  )
}

export default SwapPage
