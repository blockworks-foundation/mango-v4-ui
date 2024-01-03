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
import EditProfileModal from '@components/modals/EditProfileModal'
import MangoAccountsListModal from '@components/modals/MangoAccountsListModal'
import { TV_USER_ID_KEY } from 'utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'
import Loading from '@components/shared/Loading'
import SheenLoader from '@components/shared/SheenLoader'
import useProfileDetails from 'hooks/useProfileDetails'

const set = mangoStore.getState().set
const actions = mangoStore.getState().actions

const ConnectedMenu = () => {
  const { t } = useTranslation('common')
  const { publicKey, disconnect, wallet } = useWallet()
  const { isDesktop } = useViewport()
  const [tvUserId, setTvUserId] = useLocalStorageState(TV_USER_ID_KEY, '')
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showMangoAccountsModal, setShowMangoAccountsModal] = useState(false)
  const {
    data: profileDetails,
    isInitialLoading: loadProfileDetails,
    refetch: refetchProfileDetails,
  } = useProfileDetails()
  const groupLoaded = mangoStore((s) => s.groupLoaded)
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)

  const handleDisconnect = useCallback(() => {
    set((state) => {
      state.activityFeed.feed = []
      state.mangoAccount.current = undefined
      state.mangoAccounts = []
      state.mangoAccount.initialLoad = true
      state.mangoAccount.openOrders = {}
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
      refetchProfileDetails()
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
            className={`default-transition h-16 border-l border-th-bkg-3 ${
              isDesktop ? 'w-48 px-4' : 'w-16'
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
              {publicKey && isDesktop ? (
                loadProfileDetails || mangoAccountLoading ? (
                  <div className="ml-2.5">
                    <SheenLoader>
                      <div className="h-3 w-24 bg-th-bkg-2" />
                    </SheenLoader>
                    <SheenLoader className="mt-1.5">
                      <div className="h-4 w-16 bg-th-bkg-2" />
                    </SheenLoader>
                  </div>
                ) : (
                  <div className="ml-2.5 overflow-hidden text-left">
                    <p className="text-xs text-th-fgd-3">
                      {profileDetails?.profile_name
                        ? abbreviateAddress(publicKey)
                        : wallet?.adapter.name}
                    </p>
                    <p className="truncate pr-2 text-sm font-bold text-th-fgd-1">
                      {profileDetails?.profile_name ? (
                        <span className="capitalize">
                          {profileDetails?.profile_name}
                        </span>
                      ) : (
                        abbreviateAddress(publicKey)
                      )}
                    </p>
                  </div>
                )
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
              {!isDesktop ? (
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
                onClick={() => setShowEditProfileModal(true)}
              >
                <UserCircleIcon className="h-4 w-4" />
                <div className="pl-2 text-left">
                  {t('profile:edit-profile')}
                </div>
              </button>
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
