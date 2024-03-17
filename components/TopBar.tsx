import { useCallback, useEffect, useState } from 'react'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  Cog8ToothIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import WalletIcon from './icons/WalletIcon'
import ConnectedMenu from './wallet/ConnectedMenu'
import ConnectWalletButton from './wallet/ConnectWalletButton'
import CreateAccountModal from './modals/CreateAccountModal'
// import SolanaTps from './SolanaTps'
import useMangoAccount from 'hooks/useMangoAccount'
import useOnlineStatus from 'hooks/useOnlineStatus'
import { abbreviateAddress } from 'utils/formatting'
import DepositWithdrawModal from './modals/DepositWithdrawModal'
import AccountsButton from './AccountsButton'
import useUnownedAccount from 'hooks/useUnownedAccount'
import NotificationsButton from './notifications/NotificationsButton'
import Tooltip from './shared/Tooltip'
import { copyToClipboard } from 'utils'
import mangoStore from '@store/mangoStore'
import UserSetupModal from './modals/UserSetupModal'
import { IS_ONBOARDED_KEY, UI_TOURS_KEY } from 'utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'
import SettingsModal from './modals/SettingsModal'
import DepositWithdrawIcon from './icons/DepositWithdrawIcon'
import {
  useAccountPointsAndRank,
  useCurrentSeason,
  useIsAllClaimed,
} from 'hooks/useRewards'
import SheenLoader from './shared/SheenLoader'
import Link from 'next/link'
import FormatNumericValue from './shared/FormatNumericValue'
import { useRouter } from 'next/router'
import TopBarStore from '@store/topBarStore'
import MedalIcon from './icons/MedalIcon'
import BridgeModal from './modals/BridgeModal'
import { useViewport } from 'hooks/useViewport'
import { TOURS, startAccountTour } from 'utils/tours'

export const TOPBAR_ICON_BUTTON_CLASSES =
  'relative flex h-16 w-10 sm:w-16 items-center justify-center sm:border-l sm:border-th-bkg-3 focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2'

const set = mangoStore.getState().set

const TopBar = () => {
  const { t } = useTranslation('common')
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const { connected, publicKey, wallet } = useWallet()
  const { isMobile } = useViewport()
  const { data: seasonData } = useCurrentSeason()
  const currentSeasonId = seasonData ? seasonData.season_id : undefined
  const prevSeasonId = currentSeasonId ? currentSeasonId - 1 : undefined
  const { showClaim } = useIsAllClaimed(prevSeasonId, publicKey)
  const seasonPointsToFetchId = showClaim ? prevSeasonId : currentSeasonId
  const {
    data: accountPointsAndRank,
    isInitialLoading: loadingAccountPointsAndRank,
    refetch: refetchPoints,
  } = useAccountPointsAndRank(mangoAccountAddress, seasonPointsToFetchId)
  const router = useRouter()
  const { asPath, query } = useRouter()
  const themeData = mangoStore((s) => s.themeData)

  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit')
  const [copied, setCopied] = useState('')
  const [showDepositWithdrawModal, setShowDepositWithdrawModal] =
    useState(false)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const [showBridgeModal, setShowBridgeModal] = useState(false)
  const { showSettingsModal, setShowSettingsModal } = TopBarStore()
  const isOnline = useOnlineStatus()

  const { isUnownedAccount } = useUnownedAccount()
  const showUserSetup = mangoStore((s) => s.showUserSetup)
  const [, setIsOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)
  const [seenAccountTours] = useLocalStorageState(UI_TOURS_KEY, [])

  const handleCloseSetup = useCallback(() => {
    set((s) => {
      s.showUserSetup = false
    })
    setIsOnboarded(true)
    if (
      asPath === '/' &&
      !query?.view &&
      !seenAccountTours.includes(TOURS.ACCOUNT)
    ) {
      startAccountTour(mangoAccountAddress)
    }
  }, [setIsOnboarded, seenAccountTours, asPath, query, mangoAccountAddress])

  const handleShowSetup = useCallback(() => {
    set((s) => {
      s.showUserSetup = true
    })
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

  useEffect(() => {
    if (router.pathname === '/rewards') {
      refetchPoints()
    }
  }, [router])

  return (
    <div
      className={`flex h-16 items-center justify-between border-b border-th-bkg-3 bg-th-bkg-1 bg-contain`}
      style={{ backgroundImage: `url(${themeData.topTilePath})` }}
    >
      <div className="flex w-full items-center justify-between md:space-x-4">
        <span className="mb-0 flex items-center">
          <div className="flex h-[63px] w-16 items-center justify-center bg-th-bkg-1 md:hidden">
            <Link href="/" shallow={true}>
              <img
                className="h-8 w-8 shrink-0"
                src={themeData.logoPath}
                alt="logo"
              />
            </Link>
          </div>
          {!connected ? (
            mangoAccount ? (
              <span className="hidden items-center md:flex md:pl-6">
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
                          <CheckCircleIcon className="h-4 w-4 shrink-0 text-th-success" />
                        ) : (
                          <DocumentDuplicateIcon className="h-4 w-4 shrink-0" />
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
                          <CheckCircleIcon className="h-4 w-4 shrink-0 text-th-success" />
                        ) : (
                          <DocumentDuplicateIcon className="h-4 w-4 shrink-0" />
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
              <span className="hidden items-center md:flex md:pl-6">
                <WalletIcon className="h-5 w-5 text-th-fgd-3" />
                <span className="ml-2">{t('connect-helper')}</span>
                <ArrowRightIcon className="sideways-bounce ml-2 h-5 w-5 text-th-fgd-1" />
              </span>
            )
          ) : mangoAccountAddress ? (
            <Link href="/rewards" shallow={true}>
              <div className="flex h-[63px] items-center justify-between border-x border-th-bkg-3 bg-th-bkg-1 px-4 md:border-l-0">
                {accountPointsAndRank?.rank ? (
                  <div
                    className={`relative hidden h-6 w-6 shrink-0 items-center justify-center rounded-full sm:flex ${
                      accountPointsAndRank.rank < 4 ? '' : 'bg-th-bkg-3'
                    } mr-2`}
                  >
                    <p
                      className={`relative z-10 text-xs font-bold ${
                        accountPointsAndRank.rank < 4
                          ? 'text-th-bkg-1'
                          : 'text-th-fgd-1'
                      }`}
                    >
                      {accountPointsAndRank.rank}
                    </p>
                    {accountPointsAndRank.rank < 4 ? (
                      <MedalIcon
                        className="absolute"
                        rank={accountPointsAndRank.rank}
                      />
                    ) : null}
                  </div>
                ) : loadingAccountPointsAndRank ? (
                  <SheenLoader className="mr-2 hidden sm:block">
                    <div className="h-6 w-6 bg-th-bkg-2" />
                  </SheenLoader>
                ) : null}
                <div>
                  <span className="whitespace-nowrap font-bold text-th-fgd-2">
                    <span className="hidden sm:inline">Rewards</span> Points
                  </span>
                  {!loadingAccountPointsAndRank ? (
                    <p className="bg-gradient-to-br from-yellow-400 to-red-400 bg-clip-text font-display text-base text-transparent">
                      {accountPointsAndRank?.total_points ? (
                        <FormatNumericValue
                          value={accountPointsAndRank.total_points}
                          decimals={0}
                          roundUp
                        />
                      ) : wallet?.adapter.publicKey ? (
                        0
                      ) : (
                        '–'
                      )}
                    </p>
                  ) : (
                    <SheenLoader className="mt-1.5">
                      <div className="h-[18px] w-12 rounded-sm bg-th-bkg-3" />
                    </SheenLoader>
                  )}
                </div>
                <ChevronRightIcon className="ml-2 h-6 w-6 text-th-fgd-4" />
              </div>
            </Link>
          ) : null}
        </span>
        {!isOnline ? (
          <div className="absolute left-1/2 top-3 z-10 flex h-10 w-max -translate-x-1/2 items-center rounded-full bg-th-down px-4 py-2 md:top-8">
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-th-fgd-1" />
            <p className="ml-2 text-th-fgd-1">
              Your connection appears to be offline
            </p>
          </div>
        ) : null}
        <div className="flex items-center">
          {isUnownedAccount || !connected ? null : (
            <div className="h-[63px] bg-th-bkg-1">
              <button
                onClick={() => handleDepositWithdrawModal('deposit')}
                className={TOPBAR_ICON_BUTTON_CLASSES}
                title="Deposit/Withdraw"
              >
                <DepositWithdrawIcon className="h-6 w-6" />
              </button>
            </div>
          )}
          {!isMobile ? (
            <div className="h-[63px] bg-th-bkg-1">
              <button
                onClick={() => setShowBridgeModal(true)}
                className={TOPBAR_ICON_BUTTON_CLASSES}
                title={t('bridge-funds')}
              >
                <span className="font-mono text-xxs font-bold">
                  {t('bridge')}
                </span>
              </button>
            </div>
          ) : null}
          <div className="h-[63px] bg-th-bkg-1">
            <button
              className={TOPBAR_ICON_BUTTON_CLASSES}
              onClick={() => setShowSettingsModal(true)}
              title={t('settings')}
            >
              <Cog8ToothIcon className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </button>
          </div>
          {connected ? (
            <div className="flex h-[63px] items-center bg-th-bkg-1">
              {mangoAccountAddress && <NotificationsButton />}
              <AccountsButton />
              <div className="pl-2 sm:pl-0">
                <ConnectedMenu />
              </div>
            </div>
          ) : (
            <div className="pl-2 sm:pl-0">
              <ConnectWalletButton handleShowSetup={handleShowSetup} />
            </div>
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
      {showSettingsModal ? (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      ) : null}
      {showBridgeModal ? (
        <BridgeModal
          isOpen={showBridgeModal}
          onClose={() => setShowBridgeModal(false)}
        />
      ) : null}
    </div>
  )
}

export default TopBar
