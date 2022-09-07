import { Fragment, useState } from 'react'
import {
  CheckCircleIcon,
  ChevronDownIcon,
  PlusCircleIcon,
} from '@heroicons/react/20/solid'
import { Popover, Transition } from '@headlessui/react'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import mangoStore from '../store/mangoStore'
import { LinkButton } from './shared/Button'
import CreateAccountModal from './modals/CreateAccountModal'
import { useLocalStorageStringState } from '../hooks/useLocalStorageState'
import { LAST_ACCOUNT_KEY } from '../utils/constants'
import { useTranslation } from 'next-i18next'
import { retryFn } from '../utils'

const MangoAccountsList = ({
  mangoAccount,
}: {
  mangoAccount: MangoAccount
}) => {
  const { t } = useTranslation('common')
  const mangoAccounts = mangoStore((s) => s.mangoAccounts.accounts)
  const [showNewAccountModal, setShowNewAccountModal] = useState(false)
  const [, setLastAccountViewed] = useLocalStorageStringState(LAST_ACCOUNT_KEY)

  const handleSelectMangoAccount = async (acc: MangoAccount) => {
    const set = mangoStore.getState().set
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    if (!group) return

    try {
      const reloadedMangoAccount = await retryFn(() =>
        acc.reload(client, group)
      )
      set((s) => {
        s.mangoAccount.current = reloadedMangoAccount
        s.mangoAccount.lastUpdatedAt = new Date().toISOString()
      })
      setLastAccountViewed(acc.publicKey.toString())
    } catch (e) {
      console.warn('Error selecting account', e)
    }
  }

  return (
    <>
      <Popover>
        {({ open }) => (
          <>
            <Popover.Button className="flex w-full items-center rounded-none text-th-fgd-1 hover:text-th-primary">
              <div className="mr-2">
                <p className="text-right text-xs">{t('accounts')}</p>
                <p className="text-left text-sm font-bold text-th-fgd-1">
                  {mangoAccount.name}
                </p>
              </div>
              <ChevronDownIcon
                className={`${
                  open ? 'rotate-180' : 'rotate-360'
                } mt-0.5 h-6 w-6 flex-shrink-0 text-th-fgd-3`}
              />
            </Popover.Button>
            <div className="relative">
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
                <Popover.Panel className="absolute top-[13.5px] -right-5 z-10 mr-4 w-56 rounded-md rounded-t-none border border-th-bkg-3 bg-th-bkg-1 p-4">
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
                      <span className="ml-2">New Sub-account</span>
                    </LinkButton>
                  </div>
                </Popover.Panel>
              </Transition>
            </div>
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
