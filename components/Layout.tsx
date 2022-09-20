import SideNav from './SideNav'
import { ReactNode, useEffect } from 'react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../utils/theme'
import mangoStore from '@store/mangoStore'
import BottomBar from './mobile/BottomBar'
import BounceLoader from './shared/BounceLoader'
import TopBar from './TopBar'
import useLocalStorageState from '../hooks/useLocalStorageState'
import {
  IS_ONBOARDED_KEY,
  ONBOARDING_TOUR_KEY,
  SIDEBAR_COLLAPSE_KEY,
} from '../utils/constants'
import OnboardingTour from './OnboardingTour'

const Layout = ({ children }: { children: ReactNode }) => {
  const connected = mangoStore((s) => s.connected)
  const loadingMangoAccount = mangoStore((s) => s.mangoAccount.initialLoad)
  const [isCollapsed, setIsCollapsed] = useLocalStorageState(
    SIDEBAR_COLLAPSE_KEY,
    false
  )
  const [showOnboardingTour] = useLocalStorageState(ONBOARDING_TOUR_KEY, false)
  const [isOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)
  const { width } = useViewport()

  useEffect(() => {
    if (width < breakpoints.lg) {
      setIsCollapsed(true)
    }
  }, [width])

  const handleToggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <>
      {connected && loadingMangoAccount ? (
        <div className="fixed z-30 flex h-screen w-full items-center justify-center bg-[rgba(0,0,0,0.7)]">
          <BounceLoader />
        </div>
      ) : null}
      <div className="flex-grow bg-th-bkg-1 text-th-fgd-1 transition-all">
        <div className="flex">
          <div className="fixed bottom-0 left-0 z-20 w-full md:hidden">
            <BottomBar />
          </div>

          <div className="fixed z-20 hidden h-screen md:block">
            <button
              className="default-transition absolute right-0 top-1/2 z-20 hidden h-8 w-3 -translate-y-1/2 rounded-none rounded-l bg-th-bkg-3 hover:bg-th-bkg-4 focus:outline-none lg:block"
              onClick={handleToggleSidebar}
            >
              <ChevronRightIcon
                className={`absolute bottom-2 -right-[2px] h-4 w-4 flex-shrink-0 ${
                  !isCollapsed ? 'rotate-180' : 'rotate-360'
                }`}
              />
            </button>
            <div className={`h-full ${!isCollapsed ? 'overflow-y-auto' : ''}`}>
              <SideNav collapsed={isCollapsed} />
            </div>
          </div>

          <div
            className={`w-full transition-all duration-500 ease-in-out ${
              isCollapsed ? 'md:pl-[64px]' : 'md:pl-44 lg:pl-48 xl:pl-52'
            }`}
          >
            <div className="flex h-16 items-center justify-between border-b border-th-bkg-3 bg-th-bkg-1 pl-6">
              <img
                className="mr-4 h-8 w-auto md:hidden"
                src="/logos/logo-mark.svg"
                alt="next"
              />
              <TopBar />
            </div>
            {children}
          </div>
        </div>
      </div>
      {showOnboardingTour && isOnboarded && connected ? (
        <OnboardingTour />
      ) : null}
    </>
  )
}

export default Layout
