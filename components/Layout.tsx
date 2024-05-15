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
  NON_RESTRICTED_JURISDICTION_KEY,
  SECONDS,
  SIDEBAR_COLLAPSE_KEY,
  SLOTS_WARNING_KEY,
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
import WarningBanner from './shared/WarningBanner'
import useMangoAccountAccounts from 'hooks/useMangoAccountAccounts'
import TokenSlotsWarningModal, {
  WARNING_LEVEL,
} from './modals/TokenSlotsWarningModal'
import useMangoAccount from 'hooks/useMangoAccount'
import useUnownedAccount from 'hooks/useUnownedAccount'
import NewListingBanner from './NewListingBanner'
import useIpAddress from 'hooks/useIpAddress'
import RestrictedCountryModal from './modals/RestrictedCountryModal'
import useCollateralFeePositions from 'hooks/useCollateralFeePositions'
import CollateralFeeWarningModal from './modals/CollateralFeeWarningModal'

export const sideBarAnimationDuration = 300
const termsLastUpdated = 1679441610978

const Layout = ({ children }: { children: ReactNode }) => {
  const themeData = mangoStore((s) => s.themeData)
  const { theme } = useTheme()
  const { showCollateralFeeWarning } = useCollateralFeePositions()
  const [isCollapsed, setIsCollapsed] = useLocalStorageState(
    SIDEBAR_COLLAPSE_KEY,
    false,
  )
  const [hasSeenSlotsWarning, setHasSeenSlotsWarning] = useLocalStorageState(
    SLOTS_WARNING_KEY,
    undefined,
  )
  const { asPath } = useRouter()
  const { usedTokens, totalTokens } = useMangoAccountAccounts()
  const { mangoAccountAddress } = useMangoAccount()
  const { isUnownedAccount } = useUnownedAccount()

  const showSlotsNearlyFullWarning = useMemo(() => {
    const slotsAvailable = totalTokens.length - usedTokens.length
    if (
      hasSeenSlotsWarning === 0 ||
      !slotsAvailable ||
      slotsAvailable > 1 ||
      isUnownedAccount
    )
      return false
    return true
  }, [hasSeenSlotsWarning, usedTokens, totalTokens])

  const showSlotsFullWarning = useMemo(() => {
    const slotsAvailable = totalTokens.length - usedTokens.length
    if (
      hasSeenSlotsWarning === 1 ||
      slotsAvailable ||
      !mangoAccountAddress ||
      isUnownedAccount
    )
      return false
    return true
  }, [hasSeenSlotsWarning, usedTokens, totalTokens, mangoAccountAddress])

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
            className="absolute bottom-20 right-0 z-20 hidden h-8 w-3 rounded-none rounded-l bg-th-bkg-3 hover:bg-th-bkg-4 focus:outline-none focus-visible:bg-th-bkg-4 lg:flex lg:items-center lg:justify-center"
            onClick={handleToggleSidebar}
          >
            <ChevronRightIcon
              className={`h-4 w-4 shrink-0 ${!isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
          <SideNav collapsed={isCollapsed} />
        </div>
        <div
          className={`w-full transition-all duration-${sideBarAnimationDuration} ease-in-out ${
            isCollapsed ? 'md:pl-[64px]' : 'pl-[200px]'
          }`}
        >
          <TopBar />
          {asPath !== '/rewards' ? <PromoBanner /> : null}
          <NewListingBanner />
          <div className="pb-12 md:pb-[27px]">
            {children}
            <WarningBanner />
          </div>
          <StatusBar collapsed={isCollapsed} />
        </div>
        <DeployRefreshManager />
        <TermsOfUse />
        <RestrictedCountryCheck />
        {showSlotsNearlyFullWarning ? (
          <TokenSlotsWarningModal
            isOpen={showSlotsNearlyFullWarning}
            onClose={() => setHasSeenSlotsWarning(WARNING_LEVEL.NEARLY_FULL)}
            warningLevel={WARNING_LEVEL.NEARLY_FULL}
          />
        ) : null}
        {showSlotsFullWarning ? (
          <TokenSlotsWarningModal
            isOpen={showSlotsFullWarning}
            onClose={() => setHasSeenSlotsWarning(WARNING_LEVEL.FULL)}
            warningLevel={WARNING_LEVEL.FULL}
          />
        ) : null}
        {showCollateralFeeWarning ? (
          <CollateralFeeWarningModal isOpen={showCollateralFeeWarning} />
        ) : null}
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

// this will only show if the ip api doesn't return the country
const RestrictedCountryCheck = () => {
  const { ipCountry, loadingIpCountry } = useIpAddress()
  const groupLoaded = mangoStore((s) => s.groupLoaded)
  const [confirmedCountry, setConfirmedCountry] = useLocalStorageState(
    NON_RESTRICTED_JURISDICTION_KEY,
    false,
  )

  const showModal = useMemo(() => {
    return !confirmedCountry && !ipCountry && !loadingIpCountry && groupLoaded
  }, [confirmedCountry, ipCountry, loadingIpCountry, groupLoaded])

  return showModal ? (
    <RestrictedCountryModal
      isOpen={showModal}
      onClose={() => {
        setConfirmedCountry(true)
      }}
    />
  ) : null
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
