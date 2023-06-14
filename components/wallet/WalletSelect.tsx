import React, { Fragment } from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Popover, Transition } from '@headlessui/react'
import { useEnhancedWallet } from './EnhancedWalletProvider'

const WalletSelect = () => {
  const { displayedWallets, handleSelect } = useEnhancedWallet()

  return (
    <Popover>
      {({ open }) => (
        <>
          <Popover.Button
            className={`flex h-16 w-10 cursor-pointer items-center justify-center rounded-none border-l border-th-bkg-4 bg-th-bkg-3 text-th-fgd-3 hover:brightness-[1.1] focus:outline-none focus-visible:bg-th-bkg-4 disabled:opacity-25`}
          >
            <ChevronDownIcon
              className={`h-6 w-6 ${open ? 'rotate-180' : 'rotate-360'}`}
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
            <Popover.Panel className="absolute top-16 right-0 z-20 w-44 rounded-md rounded-t-none bg-th-bkg-2 px-4 py-2.5 outline-none">
              {displayedWallets?.map((wallet, index) => (
                <button
                  className="flex w-full flex-row items-center justify-between rounded-none py-1.5 font-normal focus:outline-none focus-visible:text-th-active md:hover:cursor-pointer md:hover:text-th-active"
                  onClick={() => {
                    handleSelect(wallet.adapter.name)
                  }}
                  key={wallet.adapter.name + index}
                >
                  <div className="flex items-center">
                    <img
                      src={wallet.adapter.icon}
                      className="mr-2 h-5 w-5"
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
  )
}

export default WalletSelect
