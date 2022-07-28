import { Menu, Transition } from '@headlessui/react'
import { LogoutIcon } from '@heroicons/react/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import { Fragment, useCallback } from 'react'
import { useViewport } from '../../hooks/useViewport'
import mangoStore from '../../store/state'
import { notify } from '../../utils/notifications'
import ProfileImage from '../shared/ProfileImage'
import { breakpoints } from '../../utils/theme'
import { abbreviateAddress } from '../../utils/formatting'

const ConnectedMenu = () => {
  const { t } = useTranslation('common')
  const set = mangoStore((s) => s.set)
  const { wallet, publicKey } = useWallet()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const handleDisconnect = useCallback(() => {
    wallet?.adapter?.disconnect()
    set((state) => {
      state.mangoAccount.current = undefined
    })
    notify({
      type: 'info',
      title: t('wallet-disconnected'),
    })
  }, [wallet, set, t])

  return (
    <Menu>
      {({ open }) => (
        <div className="relative">
          <Menu.Button
            className={`flex h-12 w-12 items-center rounded-full hover:bg-th-bkg-2 focus:outline-none`}
          >
            <ProfileImage imageSize="48" placeholderSize="28" />
          </Menu.Button>
          <Transition
            appear={true}
            show={open}
            as={Fragment}
            enter="transition-all ease-in duration-200"
            enterFrom="opacity-0 transform scale-75"
            enterTo="opacity-100 transform scale-100"
            leave="transition ease-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Menu.Items className="absolute right-0 top-[53px] z-20 mt-1 w-48 space-y-1.5 rounded-md rounded-t-none border border-t-0 border-th-bkg-3 bg-th-bkg-1 px-4 py-2.5">
              {/* <Menu.Item>
                    <button
                      className="flex w-full flex-row items-center rounded-none py-0.5 font-normal hover:cursor-pointer hover:text-th-primary focus:outline-none"
                      onClick={() => router.push('/profile')}
                    >
                      <UserCircleIcon className="h-4 w-4" />
                      <div className="pl-2 text-left">
                        {t('profile:profile')}
                      </div>
                    </button>
                  </Menu.Item> */}
              {/* <Menu.Item>
                    <button
                      className="flex w-full flex-row items-center rounded-none py-0.5 font-normal hover:cursor-pointer hover:text-th-primary focus:outline-none"
                      onClick={() => setShowAccountsModal(true)}
                    >
                      <CurrencyDollarIcon className="h-4 w-4" />
                      <div className="pl-2 text-left">{t('accounts')}</div>
                    </button>
                  </Menu.Item> */}
              <Menu.Item>
                <button
                  className="flex w-full flex-row items-center rounded-none py-0.5 font-normal hover:cursor-pointer focus:outline-none md:hover:text-th-primary"
                  onClick={handleDisconnect}
                >
                  <LogoutIcon className="h-4 w-4" />
                  <div className="pl-2 text-left">
                    <div className="pb-0.5">{t('disconnect')}</div>
                    {publicKey ? (
                      <div className="text-xs text-th-fgd-4">
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
  )
}

export default ConnectedMenu
