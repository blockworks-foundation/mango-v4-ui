import { Fragment, useState } from 'react'
import { IconButton, LinkButton } from '../shared/Button'
import {
  EllipsisHorizontalIcon,
  PencilIcon,
  PencilSquareIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import CloseAccountModal from '../modals/CloseAccountModal'
import AccountNameModal from '../modals/AccountNameModal'
import { copyToClipboard } from 'utils'
import { notify } from 'utils/notifications'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import DelegateModal from '@components/modals/DelegateModal'
import useMangoAccount from 'hooks/useMangoAccount'
import { useWallet } from '@solana/wallet-adapter-react'
import CreateAccountModal from '@components/modals/CreateAccountModal'
import { Popover, Transition } from '@headlessui/react'
import ActionsLinkButton from './ActionsLinkButton'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'

export const handleCopyAddress = (
  mangoAccount: MangoAccount,
  successMessage: string
) => {
  copyToClipboard(mangoAccount.publicKey.toString())
  notify({
    title: successMessage,
    type: 'success',
  })
}

const AccountActions = () => {
  const { t } = useTranslation(['common', 'close-account'])
  const { mangoAccount } = useMangoAccount()
  const [showCloseAccountModal, setShowCloseAccountModal] = useState(false)
  const [showEditAccountModal, setShowEditAccountModal] = useState(false)
  const [showDelegateModal, setShowDelegateModal] = useState(false)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const { connected } = useWallet()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  return (
    <>
      {mangoAccount && !connected ? null : isMobile ? (
        <Popover className="relative">
          {({ open }) => (
            <>
              <Popover.Button
                className={`default-transition w-full focus:outline-none`}
                as="div"
              >
                <IconButton size="small">
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </IconButton>
              </Popover.Button>
              <Transition
                appear={true}
                show={open}
                as={Fragment}
                enter="transition ease-in duration-75"
                enterFrom="opacity-0 nice scale-75"
                enterTo="opacity-100 scale-100"
                leave="transition ease-out duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Popover.Panel className="absolute right-0 top-10 mt-1 space-y-2 rounded-md bg-th-bkg-2 px-4 py-2.5">
                  <ActionsLinkButton
                    mangoAccount={mangoAccount!}
                    onClick={() => setShowEditAccountModal(true)}
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="ml-2">{t('edit-account')}</span>
                  </ActionsLinkButton>
                  <ActionsLinkButton
                    mangoAccount={mangoAccount!}
                    onClick={() => setShowDelegateModal(true)}
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    <span className="ml-2">{t('delegate-account')}</span>
                  </ActionsLinkButton>
                  <ActionsLinkButton
                    mangoAccount={mangoAccount!}
                    onClick={() => setShowCloseAccountModal(true)}
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span className="ml-2">{t('close-account')}</span>
                  </ActionsLinkButton>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      ) : (
        <div className="flex items-center">
          <LinkButton
            className="border-r border-th-bkg-4 px-3 no-underline hover:text-th-fgd-1"
            onClick={() => setShowEditAccountModal(true)}
          >
            <PencilSquareIcon className="h-4 w-4" />
            <span className="ml-2">{t('edit')}</span>
          </LinkButton>
          <LinkButton
            className="border-r border-th-bkg-4 px-3 no-underline hover:text-th-fgd-1"
            onClick={() => setShowDelegateModal(true)}
          >
            <UserPlusIcon className="h-4 w-4" />
            <span className="ml-2">{t('delegate')}</span>
          </LinkButton>
          <LinkButton
            className="px-3 no-underline hover:text-th-fgd-1"
            onClick={() => setShowCloseAccountModal(true)}
          >
            <TrashIcon className="h-4 w-4" />
            <span className="ml-2">{t('delete')}</span>
          </LinkButton>
        </div>
      )}
      {showCloseAccountModal ? (
        <CloseAccountModal
          isOpen={showCloseAccountModal}
          onClose={() => setShowCloseAccountModal(false)}
        />
      ) : null}
      {showEditAccountModal ? (
        <AccountNameModal
          isOpen={showEditAccountModal}
          onClose={() => setShowEditAccountModal(false)}
        />
      ) : null}
      {showDelegateModal ? (
        <DelegateModal
          isOpen={showDelegateModal}
          onClose={() => setShowDelegateModal(false)}
        />
      ) : null}
      {showCreateAccountModal ? (
        <CreateAccountModal
          isOpen={showCreateAccountModal}
          onClose={() => setShowCreateAccountModal(false)}
        />
      ) : null}
    </>
  )
}

export default AccountActions
