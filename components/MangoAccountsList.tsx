import { Fragment, useState } from 'react'
import {
  CheckCircleIcon,
  ChevronDownIcon,
  PlusCircleIcon,
} from '@heroicons/react/solid'
import { Popover, Transition } from '@headlessui/react'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import mangoStore from '../store/state'
import { LinkButton } from './shared/Button'
import CreateAccountModal from './modals/CreateAccountModal'

const handleSelectMangoAccount = async (acc: MangoAccount) => {
  const set = mangoStore.getState().set
  const client = mangoStore.getState().client
  const group = mangoStore.getState().group
  if (!group) return

  await acc.reloadAccountData(client, group)

  set((s) => {
    s.mangoAccount.current = acc
  })
}

const MangoAccountsList = ({
  mangoAccount,
}: {
  mangoAccount: MangoAccount
}) => {
  const mangoAccounts = mangoStore((s) => s.mangoAccounts.accounts)
  const [showNewAccountModal, setShowNewAccountModal] = useState(false)

  return (
    <>
      <Popover>
        {({ open }) => (
          <>
            <Popover.Button className="flex w-full items-center justify-between rounded-none text-th-fgd-1 hover:text-th-primary">
              <p className="mr-2 text-left text-sm font-bold text-th-fgd-1">
                {mangoAccount.name}
              </p>
              <ChevronDownIcon
                className={`${
                  open ? 'rotate-180' : 'rotate-360'
                } mt-0.5 h-6 w-6 flex-shrink-0 text-th-fgd-3`}
              />
            </Popover.Button>
            <Transition
              appear={true}
              show={open}
              as={Fragment}
              enter="transition-all ease-in duration-200"
              enterFrom="opacity-0 scale-75"
              enterTo="opacity-100 scale-100"
              leave="transition ease-out duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Popover.Panel className="absolute top-[63px] z-10 mr-4 w-56 rounded-md rounded-t-none border border-th-bkg-3 bg-th-bkg-1 p-4">
                {mangoAccounts.length ? (
                  mangoAccounts.map((acc) => (
                    <div key={acc.publicKey.toString()}>
                      <button
                        onClick={() => handleSelectMangoAccount(acc)}
                        className="mb-3 flex w-full items-center justify-between border-b border-th-bkg-3 pb-3"
                      >
                        {acc.name}
                        {acc.publicKey.toString() ===
                        mangoAccount.publicKey.toString() ? (
                          <CheckCircleIcon className="h-5 w-5 text-th-green" />
                        ) : null}
                      </button>
                    </div>
                  ))
                ) : (
                  <p>Loading...</p>
                )}
                <div>
                  <LinkButton
                    className="w-full justify-center"
                    onClick={() => setShowNewAccountModal(true)}
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    <span className="ml-2">New Account</span>
                  </LinkButton>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
      {showNewAccountModal ? (
        <CreateAccountModal
          isOpen={showNewAccountModal}
          onClose={() => setShowNewAccountModal(false)}
        />
      ) : null}
    </>
  )
}

export default MangoAccountsList
