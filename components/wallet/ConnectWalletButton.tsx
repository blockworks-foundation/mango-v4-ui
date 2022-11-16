import React, { useCallback, useMemo, useEffect, useState } from 'react'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useTranslation } from 'next-i18next'
import uniqBy from 'lodash/uniqBy'
import WalletSelect from './WalletSelect'
import mangoStore from '@store/mangoStore'
import { notify } from '../../utils/notifications'
import Loading from '../shared/Loading'
import { useEnhancedWallet } from './EnhancedWalletProvider'

export const ConnectWalletButton: React.FC = () => {
  const { connecting, wallet } = useWallet()
  const { handleConnect, preselectedWalletName } = useEnhancedWallet()
  const groupLoaded = mangoStore((s) => s.groupLoaded)
  const { t } = useTranslation('common')

  return (
    <div className="relative">
      <button
        onClick={handleConnect}
        disabled={!groupLoaded}
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

              <div className="text-xxs font-normal leading-3 tracking-wider text-white">
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
