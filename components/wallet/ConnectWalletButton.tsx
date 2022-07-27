import React, {
  Fragment,
  useCallback,
  useState,
  useMemo,
  useEffect,
} from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import {
  CurrencyDollarIcon,
  LogoutIcon,
  UserCircleIcon,
} from '@heroicons/react/outline'
// import { WalletIcon } from './icons'
import { useTranslation } from 'next-i18next'
// import AccountsModal from './AccountsModal'
import uniqBy from 'lodash/uniqBy'
import { useRouter } from 'next/router'
import mangoStore from '../../store/state'
import { notify } from '../../utils/notifications'
import { abbreviateAddress } from '../../utils/formatting'
import WalletSelect from './WalletSelect'

export const handleWalletConnect = (wallet: Wallet) => {
  if (!wallet) {
    return
  }

  wallet?.adapter?.connect().catch((e) => {
    if (e.name.includes('WalletLoadError')) {
      notify({
        title: `${wallet.adapter.name} Error`,
        type: 'error',
        description: `Please install ${wallet.adapter.name} and then reload this page.`,
      })
    }
  })
}

export const ConnectWalletButton: React.FC = () => {
  const { connected, publicKey, wallet, wallets, select } = useWallet()
  const { t } = useTranslation(['common', 'profile'])
  const router = useRouter()
  const set = mangoStore((s) => s.set)
  const group = mangoStore((s) => s.group)
  const [showAccountsModal, setShowAccountsModal] = useState(false)

  const installedWallets = useMemo(() => {
    const installed: Wallet[] = []

    for (const wallet of wallets) {
      if (wallet.readyState === WalletReadyState.Installed) {
        installed.push(wallet)
      }
    }

    return installed?.length ? installed : wallets
  }, [wallets])

  const displayedWallets = useMemo(() => {
    return uniqBy([...installedWallets, ...wallets], (w) => {
      return w.adapter.name
    })
  }, [wallets, installedWallets])

  const handleConnect = useCallback(() => {
    if (wallet) {
      handleWalletConnect(wallet)
    }
  }, [wallet])

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  const handleDisconnect = useCallback(() => {
    wallet?.adapter?.disconnect()
    set((state) => {
      state.mangoAccount = undefined
    })
    notify({
      type: 'info',
      title: t('wallet-disconnected'),
    })
  }, [wallet, set, t])

  useEffect(() => {
    if (!wallet && displayedWallets?.length) {
      select(displayedWallets[0].adapter.name)
    }
  }, [wallet, displayedWallets, select])

  return (
    <>
      {connected && publicKey ? (
        <Menu>
          {({ open }) => (
            <div className="relative" id="profile-menu-tip">
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
                <Menu.Items className="absolute right-0 z-20 mt-1 w-48 space-y-1.5 rounded-md bg-th-bkg-2 px-4 py-2.5">
                  <Menu.Item>
                    <button
                      className="flex w-full flex-row items-center rounded-none py-0.5 font-normal hover:cursor-pointer hover:text-th-primary focus:outline-none"
                      onClick={() => router.push('/profile')}
                    >
                      <UserCircleIcon className="h-4 w-4" />
                      <div className="pl-2 text-left">
                        {t('profile:profile')}
                      </div>
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button
                      className="flex w-full flex-row items-center rounded-none py-0.5 font-normal hover:cursor-pointer hover:text-th-primary focus:outline-none"
                      onClick={() => setShowAccountsModal(true)}
                    >
                      <CurrencyDollarIcon className="h-4 w-4" />
                      <div className="pl-2 text-left">{t('accounts')}</div>
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button
                      className="flex w-full flex-row items-center rounded-none py-0.5 font-normal hover:cursor-pointer focus:outline-none md:hover:text-th-primary"
                      onClick={handleDisconnect}
                    >
                      <LogoutIcon className="h-4 w-4" />
                      <div className="pl-2 text-left">
                        <div className="pb-0.5">{t('disconnect')}</div>
                        <div className="text-xs text-th-fgd-4">
                          {abbreviateAddress(publicKey)}
                        </div>
                      </div>
                    </button>
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </div>
          )}
        </Menu>
      ) : (
        <div className="relative">
          <div className="relative flex h-16 w-44 bg-gradient-to-bl from-mango-theme-yellow to-mango-theme-red-dark before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.25)] before:to-transparent before:opacity-0 hover:cursor-pointer hover:overflow-hidden hover:before:-translate-x-full hover:before:animate-[shimmer_0.75s_normal] hover:before:opacity-100">
            <button
              onClick={handleConnect}
              // disabled={!mangoGroup}
              className="bg-transparent text-white focus:outline-none disabled:cursor-wait disabled:text-th-bkg-2"
            >
              <div className="default-transition flex h-full flex-row items-center justify-center space-x-3 px-4">
                <div
                  className={`flex h-[28px] w-[28px] items-center justify-center rounded-full ${
                    wallet?.adapter.name === 'Solflare' ? 'bg-black' : ''
                  }`}
                >
                  <img
                    src={wallet?.adapter.icon}
                    className={
                      wallet?.adapter.name === 'Solflare'
                        ? 'h-auto w-[20px]'
                        : 'h-auto w-[28px]'
                    }
                    alt={`${wallet?.adapter.name} icon`}
                  />
                </div>
                <div className="text-left">
                  <div className="mb-1.5 text-base font-bold leading-none">
                    {t('connect')}
                  </div>
                  {wallet?.adapter?.name && (
                    <div className="text-xxs font-normal leading-3 tracking-wider text-white">
                      {wallet.adapter.name}
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>
          <div className="absolute top-1/2 right-0 z-10 h-full -translate-y-1/2">
            <WalletSelect />
          </div>
        </div>
      )}
      {/* {showAccountsModal && (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      )} */}
    </>
  )
}
