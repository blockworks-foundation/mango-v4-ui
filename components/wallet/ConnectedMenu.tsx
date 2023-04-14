import { Menu, Transition } from '@headlessui/react'
import {
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from '@heroicons/react/20/solid'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import { Fragment, useCallback, useEffect, useState } from 'react'
import mangoStore from '@store/mangoStore'
import { notify } from '../../utils/notifications'
import ProfileImage from '../profile/ProfileImage'
import { abbreviateAddress } from '../../utils/formatting'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from '../../utils/theme'
import EditProfileModal from '@components/modals/EditProfileModal'
import MangoAccountsListModal from '@components/modals/MangoAccountsListModal'

const ConnectedMenu = () => {
  const { t } = useTranslation('common')
  const { publicKey, disconnect, wallet } = useWallet()
  const { width } = useViewport()

  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showMangoAccountsModal, setShowMangoAccountsModal] = useState(false)

  const set = mangoStore((s) => s.set)
  const actions = mangoStore.getState().actions
  // const profileDetails = mangoStore((s) => s.profile.details)
  const loadProfileDetails = mangoStore((s) => s.profile.loadDetails)

  const isMobile = width ? width < breakpoints.md : false

  const onConnectFetchAccountData = async (wallet: Wallet) => {
    if (!wallet.adapter.publicKey) return
    await actions.fetchMangoAccounts(wallet.adapter.publicKey)
    // actions.fetchTourSettings(wallet.adapter.publicKey?.toString() as string)
    actions.fetchWalletTokens(wallet.adapter.publicKey)
  }

  const handleDisconnect = useCallback(() => {
    set((state) => {
      state.activityFeed.feed = []
      state.mangoAccount.current = undefined
      state.mangoAccounts = []
      state.mangoAccount.initialLoad = true
      state.mangoAccount.openOrders = {}
      state.mangoAccount.interestTotals = { data: [], loading: false }
      state.mangoAccount.performance = {
        data: [],
        loading: true,
      }
    })
    disconnect()
    notify({
      type: 'info',
      title: t('wallet-disconnected'),
    })
  }, [set, t, disconnect])

  useEffect(() => {
    const handleGetWalletMangoData = async (wallet: Wallet) => {
      const actions = mangoStore.getState().actions
      await actions.connectMangoClientWithWallet(wallet)
      await onConnectFetchAccountData(wallet)
    }

    if (publicKey && wallet) {
      actions.fetchProfileDetails(publicKey.toString())
      handleGetWalletMangoData(wallet)
    }
  }, [publicKey, actions, wallet])

  return (
    <>
      <Menu>
        {({ open }) => (
          <div className="relative">
            <Menu.Button
              className={`default-transition h-16 ${
                !isMobile ? 'w-48 border-l border-th-bkg-3 px-4' : ''
              } hover:bg-th-bkg-2 focus:outline-none`}
            >
              <div className="flex items-center" id="account-step-one">
                <ProfileImage
                  imageSize="40"
                  placeholderSize="24"
                  isOwnerProfile
                />
                {!loadProfileDetails && !isMobile ? (
                  <div className="ml-2.5 overflow-hidden text-left">
                    <p className="text-xs text-th-fgd-3">
                      {wallet?.adapter.name}
                    </p>
                    <p className="truncate pr-2 text-sm font-bold text-th-fgd-1">
                      {publicKey ? abbreviateAddress(publicKey) : ''}
                    </p>
                    {/* <p className="truncate pr-2 text-sm font-bold capitalize text-th-fgd-1">
                      {profileDetails?.profile_name
                        ? profileDetails.profile_name
                        : 'Profile Unavailabe'}
                    </p> */}
                  </div>
                ) : null}
              </div>
            </Menu.Button>
            <Transition
              appear={true}
              show={open}
              as={Fragment}
              enter="transition ease-in duration-200"
              enterFrom="opacity-0 scale-75"
              enterTo="opacity-100 scale-100"
              leave="transition ease-out duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Menu.Items className="absolute right-0 top-[61px] z-20 mt-1 w-48 space-y-1.5 rounded-md rounded-t-none bg-th-bkg-2 px-4 py-2.5 md:rounded-r-none">
                <Menu.Item>
                  <button
                    className="default-transition flex w-full flex-row items-center rounded-none py-0.5 font-normal focus:outline-none md:hover:cursor-pointer md:hover:text-th-fgd-1"
                    onClick={() => setShowEditProfileModal(true)}
                  >
                    <UserCircleIcon className="h-4 w-4" />
                    <div className="pl-2 text-left">
                      {t('profile:edit-profile-pic')}
                    </div>
                  </button>
                </Menu.Item>
                {isMobile ? (
                  <Menu.Item>
                    <button
                      className="default-transition flex w-full flex-row items-center rounded-none py-0.5 font-normal focus:outline-none"
                      onClick={() => setShowMangoAccountsModal(true)}
                    >
                      <CurrencyDollarIcon className="h-4 w-4" />
                      <div className="pl-2 text-left">{t('accounts')}</div>
                    </button>
                  </Menu.Item>
                ) : null}
                <Menu.Item>
                  <button
                    className="default-transition flex w-full flex-row items-center rounded-none py-0.5 font-normal focus:outline-none md:hover:cursor-pointer md:hover:text-th-fgd-1"
                    onClick={handleDisconnect}
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <div className="pl-2 text-left">
                      <div className="pb-0.5">{t('disconnect')}</div>
                      {publicKey ? (
                        <div className="font-mono text-xs text-th-fgd-4">
                          {abbreviateAddress(publicKey)}
                        </div>
                      ) : null}
                    </div>
                  </button>
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </div>
        )}
      </Menu>
      {showEditProfileModal ? (
        <EditProfileModal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
        />
      ) : null}

      {showMangoAccountsModal ? (
        <MangoAccountsListModal
          isOpen={showMangoAccountsModal}
          onClose={() => setShowMangoAccountsModal(false)}
        />
      ) : null}
    </>
  )
}

export default ConnectedMenu
