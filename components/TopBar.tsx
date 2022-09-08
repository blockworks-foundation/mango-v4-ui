import { useCallback, useState } from 'react'
import { ArrowRightIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'

import mangoStore from '../store/mangoStore'
import WalletIcon from './icons/WalletIcon'
import MangoAccountsList from './MangoAccountsList'
import { LinkButton } from './shared/Button'
import ConnectedMenu from './wallet/ConnectedMenu'
import { ConnectWalletButton } from './wallet/ConnectWalletButton'
import { IS_ONBOARDED_KEY } from '../utils/constants'
import useLocalStorageState from '../hooks/useLocalStorageState'
import UserSetupModal from './modals/UserSetupModal'
import CreateAccountModal from './modals/CreateAccountModal'

const TopBar = () => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const connected = mangoStore((s) => s.connected)
  const [isOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)
  const [showUserSetupModal, setShowUserSetupModal] = useState(false)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)

  const handleCloseModal = useCallback(() => {
    setShowUserSetupModal(false)
  }, [])

  const handleShowModal = useCallback(() => {
    setShowUserSetupModal(true)
  }, [])

  return (
    <>
      <div className="flex w-full items-center justify-between space-x-4">
        <span className="mb-0">
          {!connected ? (
            <span className="hidden items-center md:flex">
              <WalletIcon className="h-5 w-5 text-th-fgd-3" />
              <span className="ml-2">{t('connect-helper')}</span>
              <ArrowRightIcon className="sideways-bounce ml-2 h-5 w-5 text-th-fgd-1" />
            </span>
          ) : !mangoAccount ? (
            <div className="hidden items-center md:flex">
              🥭
              <LinkButton onClick={() => setShowCreateAccountModal(true)}>
                <span className="ml-2">{t('create-account')}</span>
              </LinkButton>
            </div>
          ) : null}
        </span>
        {connected ? (
          <div className="flex items-center space-x-4">
            {mangoAccount ? (
              <MangoAccountsList mangoAccount={mangoAccount} />
            ) : null}
            <ConnectedMenu />
          </div>
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
      {showUserSetupModal ? (
        <UserSetupModal
          isOpen={showUserSetupModal}
          onClose={handleCloseModal}
        />
      ) : null}
      {showCreateAccountModal ? (
        <CreateAccountModal
          isOpen={showCreateAccountModal}
          onClose={() => setShowCreateAccountModal(false)}
          isFirstAccount
        />
      ) : null}
    </>
  )
}

export default TopBar
