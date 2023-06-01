import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import WalletIcon from './icons/WalletIcon'
import Button from './shared/Button'
import ConnectedMenu from './wallet/ConnectedMenu'
import { ConnectWalletButton } from './wallet/ConnectWalletButton'
import { IS_ONBOARDED_KEY } from '../utils/constants'
import useLocalStorageState from '../hooks/useLocalStorageState'
import CreateAccountModal from './modals/CreateAccountModal'
import { useRouter } from 'next/router'
import UserSetupModal from './modals/UserSetupModal'
import SolanaTps from './SolanaTps'
import useMangoAccount from 'hooks/useMangoAccount'
import useOnlineStatus from 'hooks/useOnlineStatus'
import { abbreviateAddress } from 'utils/formatting'
import DepositWithdrawModal from './modals/DepositWithdrawModal'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import AccountsButton from './AccountsButton'
import useUnownedAccount from 'hooks/useUnownedAccount'
import NotificationsButton from './notifications/NotificationsButton'
import Tooltip from './shared/Tooltip'
import { copyToClipboard } from 'utils'

const TopBar = () => {
  const { t } = useTranslation('common')
  const { mangoAccount } = useMangoAccount()
  const { connected } = useWallet()
  const [isOnboarded, setIsOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit')
  const [showUserSetup, setShowUserSetup] = useState(false)
  const [copied, setCopied] = useState('')
  const [showDepositWithdrawModal, setShowDepositWithdrawModal] =
    useState(false)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const isOnline = useOnlineStatus()
  const router = useRouter()
  const { query } = router
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false
  const { isUnownedAccount } = useUnownedAccount()

  const handleCloseSetup = useCallback(() => {
    setShowUserSetup(false)
    setIsOnboarded(true)
  }, [setShowUserSetup, setIsOnboarded])

  const handleShowSetup = useCallback(() => {
    setShowUserSetup(true)
  }, [])

  const handleDepositWithdrawModal = (action: 'deposit' | 'withdraw') => {
    if (!connected || mangoAccount) {
      setAction(action)
      setShowDepositWithdrawModal(true)
    } else {
      setShowCreateAccountModal(true)
    }
  }

  const handleCopy = (text: string) => {
    copyToClipboard(text)
    setCopied(text)
  }

  useEffect(() => {
    setTimeout(() => setCopied(''), 2000)
  }, [copied])

  return (
    <div
      className={`flex h-16 items-center justify-between border-b border-th-bkg-3 bg-th-bkg-1 ${
        query.token || query.market ? '' : 'pl-4 md:pl-6'
      }`}
    >
      <div className="flex w-full items-center justify-between md:space-x-4">
        <span className="mb-0 flex items-center">
          {query.token || query.market ? (
            <button
              className="mr-4 flex h-16 w-16 items-center justify-center border-r border-th-bkg-3 focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          ) : null}
          {connected ? (
            <div className="hidden md:block">
              <SolanaTps />
            </div>
          ) : null}
          <img
            className="mr-4 h-8 w-8 flex-shrink-0 md:hidden"
            src="/logos/logo-mark.svg"
            alt="next"
          />
          {!connected ? (
            mangoAccount ? (
              <span className="hidden items-center md:flex">
                <EyeIcon className="h-5 w-5 text-th-fgd-3" />
                <span className="ml-2">
                  {t('unowned-helper', {
                    accountPk: '',
                  })}
                </span>
                :
                <Tooltip
                  content={
                    <>
                      <p>{t('account')}</p>
                      <button
                        className="mb-2 flex items-center"
                        onClick={() =>
                          handleCopy(mangoAccount.publicKey.toString())
                        }
                      >
                        <p className="mr-1.5 font-mono text-th-fgd-1">
                          {abbreviateAddress(mangoAccount.publicKey)}
                        </p>
                        {copied === mangoAccount.publicKey.toString() ? (
                          <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-th-success" />
                        ) : (
                          <DocumentDuplicateIcon className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>
                      <p>{t('wallet')}</p>
                      <button
                        className="flex items-center"
                        onClick={() =>
                          handleCopy(mangoAccount.owner.toString())
                        }
                      >
                        <p className="mr-1.5 font-mono text-th-fgd-1">
                          {abbreviateAddress(mangoAccount.owner)}
                        </p>
                        {copied === mangoAccount.owner.toString() ? (
                          <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-th-success" />
                        ) : (
                          <DocumentDuplicateIcon className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>
                    </>
                  }
                >
                  <span className="tooltip-underline ml-1 font-bold text-th-fgd-1">
                    {mangoAccount.name
                      ? mangoAccount.name
                      : abbreviateAddress(mangoAccount.publicKey)}
                  </span>
                </Tooltip>
              </span>
            ) : (
              <span className="hidden items-center md:flex">
                <WalletIcon className="h-5 w-5 text-th-fgd-3" />
                <span className="ml-2">{t('connect-helper')}</span>
                <ArrowRightIcon className="sideways-bounce ml-2 h-5 w-5 text-th-fgd-1" />
              </span>
            )
          ) : null}
        </span>
        {!isOnline ? (
          <div className="absolute top-3 left-1/2 z-10 flex h-10 w-max -translate-x-1/2 items-center rounded-full bg-th-down py-2 px-4 md:top-8">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-th-fgd-1" />
            <p className="ml-2 text-th-fgd-1">
              Your connection appears to be offline
            </p>
          </div>
        ) : null}
        <div className="flex items-center">
          {isUnownedAccount || (!connected && isMobile) ? null : isMobile ? (
            <button
              onClick={() => handleDepositWithdrawModal('deposit')}
              className="h-16 border-l border-th-bkg-3 px-4 font-display text-th-fgd-1"
            >{`${t('deposit')} / ${t('withdraw')}`}</button>
          ) : (
            <Button
              onClick={() => handleDepositWithdrawModal('deposit')}
              secondary
              className="mr-4"
            >{`${t('deposit')} / ${t('withdraw')}`}</Button>
          )}
          {connected ? (
            <div className="flex items-center">
              <NotificationsButton />
              <AccountsButton />
              <ConnectedMenu />
            </div>
          ) : isOnboarded || router.asPath === '/swap' ? (
            <ConnectWalletButton />
          ) : (
            <button
              className="relative h-16 rounded-none bg-th-bkg-2 bg-gradient-to-bl px-6 font-display text-base text-th-fgd-1 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-th-bkg-4 before:to-transparent before:opacity-0 hover:cursor-pointer hover:overflow-hidden hover:before:-translate-x-full hover:before:animate-[shimmer_0.75s_normal] hover:before:opacity-100"
              onClick={handleShowSetup}
            >
              <div className="relative z-10 flex items-center justify-center">
                <WalletIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                {t('connect')}
              </div>
            </button>
          )}
        </div>
      </div>
      {showDepositWithdrawModal ? (
        <DepositWithdrawModal
          action={action}
          isOpen={showDepositWithdrawModal}
          onClose={() => setShowDepositWithdrawModal(false)}
        />
      ) : null}
      {showUserSetup ? (
        <UserSetupModal isOpen={showUserSetup} onClose={handleCloseSetup} />
      ) : null}
      {showCreateAccountModal ? (
        <CreateAccountModal
          isOpen={showCreateAccountModal}
          onClose={() => setShowCreateAccountModal(false)}
        />
      ) : null}
    </div>
  )
}

export default TopBar
