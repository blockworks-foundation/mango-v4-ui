import React, { useCallback, useMemo, useEffect } from 'react'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useTranslation } from 'next-i18next'
// import AccountsModal from './AccountsModal'
import uniqBy from 'lodash/uniqBy'
import WalletSelect from './WalletSelect'
import mangoStore from '../../store/state'
import { handleWalletConnect } from './WalletListener'

export const ConnectWalletButton: React.FC = () => {
  const { wallet, wallets, select } = useWallet()
  const { t } = useTranslation('common')
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

  const handleConnect = useCallback(() => {
    const set = mangoStore.getState().set
    if (wallet) {
      set((state) => {
        state.mangoAccount.loading = true
      })
      handleWalletConnect(wallet)
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
        className="bg-transparent text-white focus:outline-none disabled:cursor-wait disabled:text-th-bkg-2"
      >
        <div className="relative flex h-16 w-44 bg-gradient-to-bl from-mango-theme-yellow to-mango-theme-red-dark before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.25)] before:to-transparent before:opacity-0 hover:cursor-pointer hover:overflow-hidden hover:before:-translate-x-full hover:before:animate-[shimmer_0.75s_normal] hover:before:opacity-100">
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
