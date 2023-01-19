import React, { useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import WalletSelect from './WalletSelect'
import mangoStore from '@store/mangoStore'
import Loading from '../shared/Loading'
import { useEnhancedWallet } from './EnhancedWalletProvider'

export const ConnectWalletButton: React.FC = () => {
  const { connecting, wallet } = useWallet()
  const { displayedWallets, handleConnect, preselectedWalletName } =
    useEnhancedWallet()
  const groupLoaded = mangoStore((s) => s.groupLoaded)
  const { t } = useTranslation('common')

  const selectedWallet = useMemo(() => {
    if (!displayedWallets.length || !preselectedWalletName) return undefined
    return displayedWallets.find(
      (w) => w.adapter.name === preselectedWalletName
    )
  }, [displayedWallets, preselectedWalletName])

  return (
    <div className="relative">
      <button
        onClick={handleConnect}
        disabled={!groupLoaded}
        className={` text-white focus:outline-none disabled:cursor-wait disabled:opacity-25`}
      >
        <div className="relative flex h-16 w-44 bg-th-bkg-2 py-2 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-th-bkg-4 before:to-transparent before:opacity-0 hover:overflow-hidden hover:before:-translate-x-full hover:before:animate-[shimmer_0.75s_normal] hover:before:opacity-100">
          <div className="default-transition relative z-10 flex h-full items-center justify-center space-x-3 px-4">
            {connecting ? (
              <Loading className="h-[28px] w-[28px]" />
            ) : (
              <div
                className={`flex h-[28px] w-[28px] items-center justify-center rounded-full ${
                  wallet?.adapter.name === 'Solflare' ? 'bg-black' : ''
                }`}
              >
                <img
                  src={wallet?.adapter.icon || selectedWallet?.adapter.icon}
                  className={
                    wallet?.adapter.name === 'Solflare'
                      ? 'h-auto w-[20px]'
                      : 'h-auto w-[28px]'
                  }
                  alt={`${wallet?.adapter.name} icon`}
                />
              </div>
            )}
            <div className="text-left">
              <div className="mb-1.5 flex font-display text-base leading-none text-th-fgd-1">
                {t('connect')}
              </div>

              <div className="text-xxs font-normal leading-3 text-th-fgd-3">
                {preselectedWalletName}
              </div>
            </div>
          </div>
        </div>
      </button>
      <div className="absolute top-1/2 right-0 z-10 h-full -translate-y-1/2">
        <WalletSelect />
      </div>
    </div>
  )
}
