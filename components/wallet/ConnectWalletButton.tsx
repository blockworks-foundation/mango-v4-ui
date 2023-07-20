import React, { Fragment, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import WalletIcon from '@components/icons/WalletIcon'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { IS_ONBOARDED_KEY } from 'utils/constants'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Popover, Transition } from '@headlessui/react'
import Loading from '@components/shared/Loading'
import mangoStore from '@store/mangoStore'
import { WalletReadyState } from '@solana/wallet-adapter-base'

export default function ConnectWalletButton({
  handleShowSetup,
}: {
  handleShowSetup: () => void
}) {
  const { t } = useTranslation('common')
  const { wallet, wallets, select } = useWallet()
  const [isOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)

  const detectedWallets = useMemo(() => {
    return wallets.filter(
      (w) =>
        w.readyState === WalletReadyState.Installed ||
        w.readyState === WalletReadyState.Loadable
    )
  }, [wallets])

  return (
    <>
      {isOnboarded ? (
        <Popover>
          {({ open }) => (
            <>
              <div className="flex">
                <Popover.Button
                  className={`rounded-none bg-th-bkg-3 text-th-fgd-1 hover:text-white focus:outline-none focus-visible:bg-th-bkg-4`}
                >
                  <div className="relative flex h-16 font-display before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-th-bkg-4 before:to-transparent before:opacity-0 hover:overflow-hidden hover:before:-translate-x-full hover:before:animate-[shimmer_0.75s_normal] hover:before:opacity-100 focus-visible:bg-th-bkg-4 disabled:cursor-wait disabled:opacity-25">
                    <div className="mx-6 my-4 flex items-center">
                      <div className="relative z-10 flex h-full items-center justify-center">
                        <div className="relative z-10 flex items-center justify-center">
                          {wallet?.adapter.name && mangoAccountLoading ? (
                            <Loading className="mr-2 h-6 w-6" />
                          ) : (
                            <WalletIcon className="mr-2 h-6 w-6" />
                          )}
                          {t('connect')}
                        </div>
                      </div>
                      <ChevronDownIcon
                        className={`ml-2 h-6 w-6 flex-shrink-0 ${
                          open ? 'rotate-180' : 'rotate-360'
                        }`}
                      />
                    </div>
                  </div>
                </Popover.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-in duration-200"
                enterFrom="opacity-0 scale-75"
                enterTo="opacity-100 scale-100"
                leave="transition ease-out duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Popover.Panel className="absolute top-16 right-0 z-20 w-48 rounded-md rounded-t-none bg-th-bkg-2 px-4 py-2.5 outline-none">
                  {detectedWallets.map((wallet, index) => (
                    <button
                      className="flex w-full flex-row items-center justify-between rounded-none py-2 font-normal focus:outline-none focus-visible:text-th-active md:hover:cursor-pointer md:hover:text-th-active"
                      onClick={() => {
                        select(wallet.adapter.name)
                      }}
                      key={wallet.adapter.name + index}
                    >
                      <div className="flex items-center">
                        <img
                          src={wallet.adapter.icon}
                          className="mr-2.5 h-5 w-5"
                          alt={`${wallet.adapter.name} icon`}
                        />
                        {wallet.adapter.name}
                      </div>
                    </button>
                  ))}
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      ) : (
        <button
          className="relative h-16 rounded-none bg-th-bkg-3 bg-gradient-to-bl px-6 font-display text-base text-th-fgd-1 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-th-bkg-4 before:to-transparent before:opacity-0 hover:cursor-pointer hover:overflow-hidden hover:before:-translate-x-full hover:before:animate-[shimmer_0.75s_normal] hover:before:opacity-100"
          onClick={handleShowSetup}
        >
          <div className="relative z-10 flex items-center justify-center">
            <WalletIcon className="mr-2 h-5 w-5 flex-shrink-0" />
            {t('connect')}
          </div>
        </button>
      )}
    </>
  )
}
