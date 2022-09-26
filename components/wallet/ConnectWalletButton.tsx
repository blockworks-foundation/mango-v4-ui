import React, { useCallback, useMemo, useEffect, useState } from 'react'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useTranslation } from 'next-i18next'
// import AccountsModal from './AccountsModal'
import uniqBy from 'lodash/uniqBy'
import WalletSelect from './WalletSelect'
import mangoStore from '@store/mangoStore'
import { Wallet as AnchorWallet } from '@project-serum/anchor'
import { notify } from '../../utils/notifications'
import Loading from '../shared/Loading'

export const handleWalletConnect = async (wallet: Wallet) => {
  if (!wallet) {
    return
  }
  const actions = mangoStore.getState().actions
  const set = mangoStore.getState().set

  try {
    await wallet?.adapter?.connect()
    await actions.connectMangoClientWithWallet(wallet)
    await onConnectFetchAccountData(wallet)
    set((state) => {
      state.connected = true
    })
  } catch (e: any) {
    console.error('WALLET CONNECT ERROR:', e)
    if (e.name.includes('WalletLoadError')) {
      notify({
        title: `${wallet.adapter.name} Error`,
        type: 'error',
        description: `Please install ${wallet.adapter.name} and then reload this page.`,
      })
    } else {
      notify({
        title: `${wallet.adapter.name} Error`,
        type: 'error',
        description: `${wallet.adapter.name} not available.`,
      })
    }
  }
}

const onConnectFetchAccountData = async (wallet: Wallet) => {
  if (!wallet) return
  const actions = mangoStore.getState().actions
  await actions.fetchMangoAccounts(wallet.adapter as unknown as AnchorWallet)
  actions.fetchProfilePicture(wallet.adapter as unknown as AnchorWallet)
  actions.fetchWalletTokens(wallet.adapter as unknown as AnchorWallet)
}

export const ConnectWalletButton: React.FC = () => {
  const { wallet, wallets, select } = useWallet()
  const group = mangoStore((s) => s.group)
  const { t } = useTranslation('common')
  const [connecting, setConnecting] = useState(false)
  // const [showAccountsModal, setShowAccountsModal] = useState(false)

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

  const handleConnect = useCallback(async () => {
    setConnecting(true)
    const group = mangoStore.getState().group
    try {
      if (wallet && group) {
        await handleWalletConnect(wallet)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setConnecting(false)
    }
  }, [wallet])

  // const handleCloseAccounts = useCallback(() => {
  //   setShowAccountsModal(false)
  // }, [])

  useEffect(() => {
    if (!wallet && displayedWallets?.length) {
      select(displayedWallets[0].adapter.name)
    }
  }, [wallet, displayedWallets, select])

  return (
    <div className="relative">
      <button
        onClick={handleConnect}
        disabled={!group}
        className={` text-white focus:outline-none disabled:cursor-wait disabled:opacity-25`}
      >
        <div className="relative flex h-16 w-44 bg-gradient-to-bl from-mango-theme-yellow to-mango-theme-red-dark py-2 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.25)] before:to-transparent before:opacity-0 hover:overflow-hidden hover:before:-translate-x-full hover:before:animate-[shimmer_0.75s_normal] hover:before:opacity-100">
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
              <div className="mb-1.5 flex justify-center text-base font-bold leading-none">
                {connecting ? <Loading className="h-4 w-4" /> : t('connect')}
              </div>
              {wallet?.adapter?.name && (
                <div className="text-xxs font-normal leading-3 tracking-wider text-white">
                  {wallet.adapter.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
      <div className="absolute top-1/2 right-0 z-10 h-full -translate-y-1/2">
        <WalletSelect />
      </div>
    </div>
    // {showAccountsModal && (
    //   <AccountsModal
    //     onClose={handleCloseAccounts}
    //     isOpen={showAccountsModal}
    //   />
    // )}
  )
}
