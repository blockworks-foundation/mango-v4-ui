import React, { Fragment } from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Popover, Transition } from '@headlessui/react'
import { useEnhancedWallet } from './EnhancedWalletProvider'
import useMangoGroup from 'hooks/useMangoGroup'

const WalletSelect = () => {
  const { displayedWallets, handleSelect } = useEnhancedWallet()
  const { group } = useMangoGroup()

  return (
    <Popover>
      {({ open }) => (
        <>
          <Popover.Button
            className={`flex h-full w-12 cursor-pointer items-center justify-center rounded-none bg-transparent text-th-fgd-3 hover:brightness-[1.1] focus:text-th-active focus:outline-none disabled:opacity-25`}
            disabled={!group}
          >
            <ChevronDownIcon
              className={`default-transition h-6 w-6 ${
                open ? 'rotate-180' : 'rotate-360'
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
            <Popover.Panel className="absolute top-16 right-0 z-20 w-44 rounded-md rounded-t-none bg-th-bkg-2 px-4 py-2.5 outline-none">
              {displayedWallets?.map((wallet, index) => (
                <button
                  className="flex w-full flex-row items-center justify-between rounded-none py-1.5 font-normal focus:text-th-active focus:outline-none md:hover:cursor-pointer md:hover:text-th-active"
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
