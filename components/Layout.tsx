import SideNav from './SideNav'
import {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ArrowPathIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { nftThemeMeta } from '../utils/theme'
import mangoStore from '@store/mangoStore'
import BottomBar from './mobile/BottomBar'
import TopBar from './TopBar'
import useLocalStorageState from '../hooks/useLocalStorageState'
import {
  ACCEPT_TERMS_KEY,
  SECONDS,
  SIDEBAR_COLLAPSE_KEY,
} from '../utils/constants'
import { useWallet } from '@solana/wallet-adapter-react'
import SuccessParticles from './shared/SuccessParticles'
import { tsParticles } from 'tsparticles-engine'
import { loadFull } from 'tsparticles'
import useInterval from './shared/useInterval'
import { Transition } from '@headlessui/react'
import { useTranslation } from 'next-i18next'
import TermsOfUseModal from './modals/TermsOfUseModal'
import { useTheme } from 'next-themes'
import PromoBanner from './rewards/PromoBanner'
import { useRouter } from 'next/router'
import StatusBar from './StatusBar'

export const sideBarAnimationDuration = 300
const termsLastUpdated = 1679441610978

const Layout = ({ children }: { children: ReactNode }) => {
  const themeData = mangoStore((s) => s.themeData)
  const { theme } = useTheme()
  const [isCollapsed, setIsCollapsed] = useLocalStorageState(
    SIDEBAR_COLLAPSE_KEY,
    false,
  )
  const { asPath } = useRouter()

  useEffect(() => {
    const animationFrames = 15

    for (let x = 1; x <= animationFrames; x++) {
      setTimeout(
        () => {
          window.dispatchEvent(new Event('resize'))
        },
        (sideBarAnimationDuration / animationFrames) * x,
      )
    }
  }, [isCollapsed])

  const handleToggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const particlesInit = useCallback(async () => {
    await loadFull(tsParticles)
  }, [])

  useEffect(() => {
    particlesInit()
  }, [particlesInit])

  useEffect(() => {
    const set = mangoStore.getState().set
    if (theme && nftThemeMeta[theme]) {
      set((s) => {
        s.themeData = nftThemeMeta[theme]
      })
    } else {
      set((s) => {
        s.themeData = nftThemeMeta.default
      })
    }
  }, [theme])

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <main
      className={`${themeData.fonts.body.variable} ${themeData.fonts.display.variable} ${themeData.fonts.mono.variable} font-sans`}
    >
      <div className="fixed z-30">
        <SuccessParticles />
      </div>
      <div
        className={`min-h-screen grow ${
          !themeData.useGradientBg
            ? 'bg-th-bkg-1'
            : 'bg-gradient-to-b from-th-bkg-1 to-th-bkg-2'
        } text-th-fgd-2 transition-all`}
      >
        <div className="fixed bottom-0 left-0 z-20 w-full md:hidden">
          <BottomBar />
        </div>

        <div className="fixed z-20 hidden h-screen md:block">
          <button
            className="absolute right-0 top-1/2 z-20 hidden h-8 w-3 -translate-y-1/2 rounded-none rounded-l bg-th-bkg-3 hover:bg-th-bkg-4 focus:outline-none focus-visible:bg-th-bkg-4 2xl:block"
            onClick={handleToggleSidebar}
          >
            <ChevronRightIcon
              className={`absolute bottom-2 h-4 w-4 shrink-0 ${
                !isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
          <div
            className={`hide-scroll h-full ${
              !isCollapsed ? 'overflow-y-auto' : ''
            }`}
          >
            <SideNav collapsed={isCollapsed} />
          </div>
        </div>
        {/* note: overflow-x-hidden below prevents position sticky from working in activity feed  */}
        <div
          className={`w-full overflow-x-hidden transition-all duration-${sideBarAnimationDuration} ease-in-out ${
            isCollapsed ? 'md:pl-[64px]' : 'pl-[200px]'
          }`}
        >
          <TopBar />
          {asPath !== '/rewards' ? <PromoBanner /> : null}
          {children}
          <StatusBar collapsed={isCollapsed} />
        </div>
        <DeployRefreshManager />
        <TermsOfUse />
      </div>
    </main>
  )
}

export default Layout

const TermsOfUse = () => {
  const { connected } = useWallet()
  const [acceptTerms, setAcceptTerms] = useLocalStorageState(
    ACCEPT_TERMS_KEY,
    '',
  )

  const showTermsOfUse = useMemo(() => {
    return (!acceptTerms || acceptTerms < termsLastUpdated) && connected
  }, [acceptTerms, connected])

  return (
    <>
      {showTermsOfUse ? (
        <TermsOfUseModal
          isOpen={showTermsOfUse}
          onClose={() => setAcceptTerms(Date.now())}
        />
      ) : null}
    </>
  )
}

function DeployRefreshManager(): JSX.Element | null {
  const { t } = useTranslation('common')
  const [newBuildAvailable, setNewBuildAvailable] = useState(false)

  useInterval(async () => {
    const response = await fetch('/api/build-id')
    const { buildId } = await response.json()

    if (buildId && process.env.BUILD_ID && buildId !== process.env.BUILD_ID) {
      // There's a new version deployed that we need to load
      setNewBuildAvailable(true)
    }
  }, 300 * SECONDS)

  return (
    <Transition
      appear={true}
      show={newBuildAvailable}
      as={Fragment}
      enter="transition ease-in duration-300"
      enterFrom="translate-y-0"
      enterTo="-translate-y-[130px] md:-translate-y-20"
      leave="transition ease-out"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <button
        className="fixed -bottom-[46px] left-1/2 z-50 flex -translate-x-1/2 items-center rounded-full border border-th-bkg-4 bg-th-bkg-3 px-4 py-3 shadow-md focus:outline-none md:hover:bg-th-bkg-4 md:hover:shadow-none"
        onClick={() => window.location.reload()}
      >
        <p className="mr-2 whitespace-nowrap text-th-fgd-1">
          {t('new-version')}
        </p>
        <ArrowPathIcon className="h-5 w-5" />
      </button>
    </Transition>
  )
}
