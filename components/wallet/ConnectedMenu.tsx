import { Popover, Transition } from '@headlessui/react'
import {
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
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
import { TV_USER_ID_KEY } from 'utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'
import Loading from '@components/shared/Loading'

const set = mangoStore.getState().set
const actions = mangoStore.getState().actions

const ConnectedMenu = () => {
  const { t } = useTranslation('common')
  const { publicKey, disconnect, wallet } = useWallet()
  const { width } = useViewport()
  const [tvUserId, setTvUserId] = useLocalStorageState(TV_USER_ID_KEY, '')
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showMangoAccountsModal, setShowMangoAccountsModal] = useState(false)

  // const profileDetails = mangoStore((s) => s.profile.details)
  const loadProfileDetails = mangoStore((s) => s.profile.loadDetails)
  const groupLoaded = mangoStore((s) => s.groupLoaded)
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const isMobile = width ? width < breakpoints.md : false

  const handleDisconnect = useCallback(() => {
    set((state) => {
      state.activityFeed.feed = []
      state.mangoAccount.current = undefined
      state.mangoAccounts = []
      state.mangoAccount.initialLoad = true
      state.mangoAccount.openOrders = {}
      state.mangoAccount.interestTotals = { data: [], loading: false }
    })
    disconnect()
    notify({
      type: 'info',
      title: t('wallet-disconnected'),
    })
  }, [t, disconnect])

  useEffect(() => {
    if (publicKey && wallet && groupLoaded) {
      actions.connectMangoClientWithWallet(wallet)
      actions.fetchMangoAccounts(publicKey)
      // actions.fetchTourSettings(publicKey?.toString() as string)
      actions.fetchProfileDetails(publicKey.toString())
      actions.fetchWalletTokens(publicKey)
      if (!tvUserId) {
        setTvUserId(publicKey.toString())
      }
    }
  }, [publicKey, wallet, groupLoaded, tvUserId, setTvUserId])

  return (
    <>
      <Popover>
        <div className="relative">
          <Popover.Button
            className={`default-transition h-16 ${
              !isMobile ? 'w-48 border-l border-th-bkg-3 px-4' : 'w-16'
            } hover:bg-th-bkg-2 focus:outline-none focus-visible:bg-th-bkg-3`}
          >
            <div
              className="flex items-center justify-center md:justify-start"
              id="account-step-one"
            >
              {!mangoAccountLoading ? (
                <ProfileImage
                  imageSize="40"
                  placeholderSize="24"
                  isOwnerProfile
                />
              ) : (
                <Loading className="h-6 w-6" />
              )}
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
          </Popover.Button>
          <Transition
            as={Fragment}
            enter="transition ease-in duration-200"
            enterFrom="opacity-0 scale-75"
            enterTo="opacity-100 scale-100"
            leave="transition ease-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Panel className="absolute right-0 top-[61px] z-20 mt-1 w-48 space-y-1.5 rounded-md rounded-t-none bg-th-bkg-2 px-4 py-2.5 focus:outline-none md:rounded-r-none">
              <button
                className="flex w-full flex-row items-center rounded-none py-0.5 font-normal focus:outline-none focus-visible:text-th-active md:hover:cursor-pointer md:hover:text-th-fgd-1"
                onClick={() => setShowEditProfileModal(true)}
              >
                <UserCircleIcon className="h-4 w-4" />
                <div className="pl-2 text-left">
                  {t('profile:edit-profile-pic')}
                </div>
              </button>
              {isMobile ? (
                <button
                  className="flex w-full flex-row items-center rounded-none py-0.5 font-normal focus:outline-none focus-visible:text-th-active"
                  onClick={() => setShowMangoAccountsModal(true)}
                >
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <div className="pl-2 text-left">{t('accounts')}</div>
                </button>
              ) : null}
              <button
                className="flex w-full flex-row items-center rounded-none py-0.5 font-normal focus:outline-none focus-visible:text-th-active md:hover:cursor-pointer md:hover:text-th-fgd-1"
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
            </Popover.Panel>
          </Transition>
        </div>
      </Popover>
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
