import SideNav from './SideNav'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { ArrowRightIcon, ChevronRightIcon } from '@heroicons/react/solid'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../utils/theme'
import { useTranslation } from 'next-i18next'
import mangoStore from '../store/state'
import BottomBar from './mobile/BottomBar'
import useLocalStorageState from '../hooks/useLocalStorageState'
import UserSetupModal from './modals/UserSetupModal'
import { ConnectWalletButton } from './wallet/ConnectWalletButton'
import ConnectedMenu from './wallet/ConnectedMenu'
import WalletIcon from './icons/WalletIcon'
import BounceLoader from './shared/BounceLoader'
import MangoAccountsList from './MangoAccountsList'
import { useWallet } from '@solana/wallet-adapter-react'
import CreateAccountModal from './modals/CreateAccountModal'
import { LinkButton } from './shared/Button'

export const IS_ONBOARDED_KEY = 'isOnboarded'

const Layout = ({ children }: { children: ReactNode }) => {
  const connected = mangoStore((s) => s.connected)
  const actions = mangoStore((s) => s.actions)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const loadingMangoAccount = mangoStore((s) => s.mangoAccount.initialLoad)
  const { t } = useTranslation('common')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  const [isOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)
  const [showUserSetupModal, setShowUserSetupModal] = useState(false)
  const [showFirstAccountModal, setShowFirstAccountModal] = useState(false)

  useEffect(() => {
    if (mangoAccount) {
      const pubKey = mangoAccount.publicKey.toString()
      actions.fetchAccountPerformance(pubKey, 1)
      actions.fetchAccountInterestTotals(pubKey)
    }
  }, [actions, mangoAccount])

  useEffect(() => {
    const collapsed = width ? width < breakpoints.xl : false
    setIsCollapsed(collapsed)
  }, [width])

  useEffect(() => {
    if (width < breakpoints.lg) {
      setIsCollapsed(true)
    }
  }, [width])

  useEffect(() => {
    if (connected && isOnboarded && !loadingMangoAccount && !mangoAccount) {
      setShowFirstAccountModal(true)
    } else {
      setShowFirstAccountModal(false)
    }
  }, [connected, isOnboarded, loadingMangoAccount, mangoAccount])

  const handleCloseModal = useCallback(() => {
    setShowUserSetupModal(false)
  }, [])

  const handleShowModal = useCallback(() => {
    setShowUserSetupModal(true)
  }, [])

  const handleToggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
  }

  return (
    <>
      {connected && loadingMangoAccount && isOnboarded ? (
        <div className="fixed z-30 flex h-screen w-full items-center justify-center bg-[rgba(0,0,0,0.7)]">
          <BounceLoader />
        </div>
      ) : null}
      <div className={`flex-grow bg-th-bkg-1 text-th-fgd-1 transition-all`}>
        <div className="flex">
          {isMobile ? (
            <div className="fixed bottom-0 left-0 z-20 w-full md:hidden">
              <BottomBar />
            </div>
          ) : (
            <div className={`fixed z-20 h-screen`}>
              <button
                className="absolute -right-4 top-1/2 z-20 hidden h-10 w-4 -translate-y-1/2 rounded-none rounded-r bg-th-bkg-4 focus:outline-none lg:block"
                onClick={handleToggleSidebar}
              >
                <ChevronRightIcon
                  className={`h-full w-full ${
                    !isCollapsed ? 'rotate-180' : 'rotate-360'
                  }`}
                />
              </button>
              <div
                className={`h-full ${!isCollapsed ? 'overflow-y-auto' : ''}`}
              >
                <SideNav collapsed={isCollapsed} />
              </div>
            </div>
          )}
          <div
            className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${
              isMobile ? '' : isCollapsed ? 'pl-[64px]' : 'pl-44 lg:pl-56'
            }`}
          >
            <div className="flex h-16 items-center justify-between border-b border-th-bkg-3 bg-th-bkg-1 px-6 md:px-8">
              <div className="flex items-center text-th-fgd-3">
                {isMobile ? (
                  <img
                    className={`mr-4 h-8 w-auto`}
                    src="/logos/logo-mark.svg"
                    alt="next"
                  />
                ) : null}
                <span className="mb-0 mr-2">
                  {mangoAccount ? (
                    <MangoAccountsList mangoAccount={mangoAccount} />
                  ) : !isMobile ? (
                    !connected ? (
                      <span className="flex items-center">
                        🔗<span className="ml-2">{t('connect-helper')}</span>
                        <ArrowRightIcon className="sideways-bounce ml-2 h-5 w-5 text-th-fgd-1" />
                      </span>
                    ) : (
                      <div className="flex items-center">
                        🥭
                        <LinkButton
                          onClick={() => setShowFirstAccountModal(true)}
                        >
                          <span className="ml-2">{t('create-account')}</span>
                        </LinkButton>
                      </div>
                    )
                  ) : null}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                {connected ? (
                  <ConnectedMenu />
                ) : isOnboarded ? (
                  <ConnectWalletButton />
                ) : (
                  <button
                    className="relative flex h-16 items-center justify-center rounded-none bg-gradient-to-bl from-mango-theme-yellow to-mango-theme-red-dark px-6 text-base font-bold text-white before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.25)] before:to-transparent before:opacity-0 hover:cursor-pointer hover:overflow-hidden hover:before:-translate-x-full hover:before:animate-[shimmer_0.75s_normal] hover:before:opacity-100"
                    onClick={handleShowModal}
                  >
                    <WalletIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                    {t('connect')}
                  </button>
                )}
              </div>
            </div>
            <div className={`min-h-screen ${isMobile ? 'p-6 pb-20' : 'p-8'}`}>
              {children}
            </div>
          </div>
        </div>
      </div>
      {showUserSetupModal ? (
        <UserSetupModal
          isOpen={showUserSetupModal}
          onClose={handleCloseModal}
        />
      ) : null}
      {showFirstAccountModal ? (
        <CreateAccountModal
          isOpen={showFirstAccountModal}
          onClose={() => setShowFirstAccountModal(false)}
          isFirstAccount
        />
      ) : null}
    </>
  )
}

export default Layout
