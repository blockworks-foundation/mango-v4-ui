import React, { Fragment, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import WalletIcon from '@components/icons/WalletIcon'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { IS_ONBOARDED_KEY, LAST_WALLET_NAME } from 'utils/constants'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Popover, Transition } from '@headlessui/react'
// import Loading from '@components/shared/Loading'
import mangoStore from '@store/mangoStore'
import { WalletName, WalletReadyState } from '@solana/wallet-adapter-base'
import { useRouter } from 'next/router'

export default function ConnectWalletButton({
  handleShowSetup,
}: {
  handleShowSetup: () => void
}) {
  const { t } = useTranslation('common')
  const { wallet, wallets, select, connected, connect } = useWallet()
  const { query } = useRouter()
  const [isOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const [lastWalletName] = useLocalStorageState<WalletName | null>(
    LAST_WALLET_NAME,
    '',
  )

  const detectedWallets = useMemo(() => {
    return wallets.filter(
      (w) =>
        w.readyState === WalletReadyState.Installed ||
        w.readyState === WalletReadyState.Loadable,
    )
  }, [wallets])

  const walletIcon = useMemo(() => {
    const wallet = wallets.find((w) => w.adapter.name === lastWalletName)
    return wallet?.adapter.icon
  }, [wallets, lastWalletName])

  return (
    <>
      {(isOnboarded || query.walletSwap) && walletIcon ? (
        <div className="flex">
          <button
            onClick={() => {
              if (wallet) {
                connect()
              } else {
                select(lastWalletName)
              }
            }}
            className="relative flex h-16 bg-th-bkg-3 py-2 text-white before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-th-bkg-4 before:to-transparent before:opacity-0 hover:overflow-hidden hover:before:-translate-x-full hover:before:animate-[shimmer_0.75s_normal] hover:before:opacity-100 focus-visible:bg-th-bkg-4 disabled:cursor-wait disabled:opacity-25"
          >
            <div className="relative z-10 flex h-full items-center justify-center space-x-3 px-4">
              {connected && mangoAccountLoading ? (
                <div></div>
              ) : (
                <div
                  className={`flex h-[28px] w-[28px] items-center justify-center rounded-full ${
                    wallet?.adapter.name === 'Solflare' ? 'bg-black' : ''
                  }`}
                >
                  <img
                    src={walletIcon}
                    className={`
                      ${
                        wallet?.adapter.name === 'Solflare'
                          ? 'h-auto w-[20px]'
                          : 'h-auto w-[28px]'
                      }`}
                    alt={`${wallet?.adapter.name} icon`}
                  />
                </div>
              )}
              <div className="text-left">
                <div className="mb-1.5 flex font-display text-sm leading-none text-th-fgd-1">
                  {t('connect')}
                </div>

                <div className="text-xxs font-normal leading-3 text-th-fgd-3">
                  {lastWalletName}
                </div>
              </div>
            </div>
          </button>
          <Popover>
            {({ open }) => (
              <>
                <Popover.Button
                  className={`flex h-16 w-10 items-center justify-center rounded-none border-l border-th-bkg-4 bg-th-bkg-3 text-th-fgd-3 hover:brightness-[1.1] focus:outline-none focus-visible:bg-th-bkg-4`}
                >
                  <ChevronDownIcon
                    className={`h-6 w-6 shrink-0 ${
                      open ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
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
                  <Popover.Panel className="absolute right-0 top-16 z-20 w-48 rounded-md rounded-t-none bg-th-bkg-2 px-4 py-2.5 outline-none">
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
        </div>
      ) : (
        <button
          className="relative h-16 rounded-none bg-th-bkg-3 bg-gradient-to-bl px-6 font-display text-base text-th-fgd-1 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-th-bkg-4 before:to-transparent before:opacity-0 hover:cursor-pointer hover:overflow-hidden hover:before:-translate-x-full hover:before:animate-[shimmer_0.75s_normal] hover:before:opacity-100"
          onClick={handleShowSetup}
        >
          <div className="relative z-10 flex items-center justify-center">
            <WalletIcon className="mr-2 h-5 w-5 shrink-0" />
            {t('connect')}
          </div>
        </button>
      )}
    </>
  )
}
