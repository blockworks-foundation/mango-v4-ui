import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
// import { WalletReadyState } from '@solana/wallet-adapter-base'
// import uniqBy from 'lodash/uniqBy'
import { CheckCircleIcon } from '@heroicons/react/solid'

const WalletSelect = () => {
  const { wallet, wallets, select } = useWallet()

  // const installedWallets = useMemo(() => {
  //   const installed: Wallet[] = []

  //   for (const wallet of wallets) {
  //     if (wallet.readyState === WalletReadyState.Installed) {
  //       installed.push(wallet)
  //     }
  //   }

  //   return installed?.length ? installed : wallets
  // }, [wallets])

  // const displayedWallets = useMemo(() => {
  //   return uniqBy([...installedWallets, ...wallets], (w) => {
  //     return w.adapter.name
  //   })
  // }, [wallets, installedWallets])

  // if (!wallets?.length) {
  //   return null
  // }

  return (
    <div className="space-y-2">
      {wallets?.map((w) => (
        <button
          key={w.adapter.name}
          className={`flex w-full items-center justify-between rounded-md border ${
            wallet?.adapter.name === w.adapter.name
              ? 'border-th-primary md:hover:border-th-primary'
              : 'border-th-bkg-4 md:hover:border-th-fgd-4'
          } py-3 px-4 text-base focus:outline-none md:hover:cursor-pointer`}
          onClick={() => select(w.adapter.name)}
        >
          <div className="flex items-center">
            <img
              src={w.adapter.icon}
              className="mr-2 h-6 w-6"
              alt={`${w.adapter.name} icon`}
            />
            {w.adapter.name}
          </div>
          {wallet?.adapter.name === w.adapter.name ? (
            <CheckCircleIcon className="h-5 w-5 text-th-primary" />
          ) : null}
        </button>
      ))}
    </div>
  )
}

export default WalletSelect
