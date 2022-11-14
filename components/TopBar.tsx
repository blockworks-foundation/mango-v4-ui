import { useCallback, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'

import mangoStore from '@store/mangoStore'
import WalletIcon from './icons/WalletIcon'
import { IconButton, LinkButton } from './shared/Button'
import ConnectedMenu from './wallet/ConnectedMenu'
import { ConnectWalletButton } from './wallet/ConnectWalletButton'
import { IS_ONBOARDED_KEY } from '../utils/constants'
import useLocalStorageState from '../hooks/useLocalStorageState'
import CreateAccountModal from './modals/CreateAccountModal'
import MangoAccountsListModal from './modals/MangoAccountsListModal'
import { useRouter } from 'next/router'
import UserSetup from './UserSetup'
import SolanaTps from './SolanaTps'

const TopBar = () => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const connected = mangoStore((s) => s.connected)
  const [isOnboarded, setIsOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)
  const [showUserSetup, setShowUserSetup] = useState(false)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const [showMangoAccountsModal, setShowMangoAccountsModal] = useState(false)
  const router = useRouter()
  const { query } = router

  const handleCloseSetup = useCallback(() => {
    setShowUserSetup(false)
    setIsOnboarded(true)
  }, [])

  const handleShowSetup = useCallback(() => {
    setShowUserSetup(true)
  }, [])

  const handleShowAccounts = useCallback(() => {
    if (mangoAccount) {
      setShowMangoAccountsModal(true)
    } else {
      setShowCreateAccountModal(true)
    }
  }, [mangoAccount])

  return (
    <>
      <div className="flex w-full items-center justify-between space-x-4">
        {connected ? <SolanaTps /> : null}
        <span className="mb-0 flex items-center">
          {query.token ? (
            <div
              className={`mr-2 flex h-16 items-center pr-4 md:mr-4 md:pr-6 ${
                !connected || !mangoAccount ? 'border-r border-th-bkg-3' : ''
              }`}
            >
              <IconButton onClick={() => router.back()} hideBg size="small">
                <ArrowLeftIcon className="h-6 w-6" />
              </IconButton>
            </div>
          ) : null}
          <img
            className="mr-4 ml-2 h-8 w-auto md:hidden"
            src="/logos/logo-mark.svg"
            alt="next"
          />
          {!connected ? (
            <span className="hidden items-center md:flex">
              <WalletIcon className="h-5 w-5 text-th-fgd-3" />
              <span className="ml-2">{t('connect-helper')}</span>
              <ArrowRightIcon className="sideways-bounce ml-2 h-5 w-5 text-th-fgd-1" />
            </span>
          ) : null}
        </span>
        {connected ? (
          <div className="flex items-center space-x-4 pr-4 md:pr-0">
            <button
              className="mr-2 hidden md:block"
              id="account-step-two"
              onClick={handleShowAccounts}
            >
              <p className="text-right text-xs">{t('accounts')}</p>
              <p className="text-left text-sm font-bold text-th-fgd-1">
                {mangoAccount ? (
                  mangoAccount.name
                ) : (
                  <span>
                    <span className="mr-1.5">🥭</span>
                    {t('create-account')}
                  </span>
                )}
              </p>
            </button>
            <ConnectedMenu />
          </div>
        ) : isOnboarded ? (
          <ConnectWalletButton />
        ) : (
          <button
            className="relative flex h-16 items-center justify-center rounded-none bg-gradient-to-bl from-mango-theme-yellow to-mango-theme-red-dark px-6 text-base font-bold text-white before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.25)] before:to-transparent before:opacity-0 hover:cursor-pointer hover:overflow-hidden hover:before:-translate-x-full hover:before:animate-[shimmer_0.75s_normal] hover:before:opacity-100"
            onClick={handleShowSetup}
          >
            <WalletIcon className="mr-2 h-5 w-5 flex-shrink-0" />
            {t('connect')}
          </button>
        )}
      </div>
      {showMangoAccountsModal ? (
        <MangoAccountsListModal
          isOpen={showMangoAccountsModal}
          onClose={() => setShowMangoAccountsModal(false)}
        />
      ) : null}
      {showUserSetup ? <UserSetup onClose={handleCloseSetup} /> : null}
      {showCreateAccountModal ? (
        <CreateAccountModal
          isOpen={showCreateAccountModal}
          onClose={() => setShowCreateAccountModal(false)}
        />
      ) : null}
    </>
  )
}

export default TopBar
