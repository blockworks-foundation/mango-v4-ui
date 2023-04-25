import { Fragment, useState } from 'react'
import Button from '../shared/Button'
import {
  ArrowDownRightIcon,
  ArrowUpLeftIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  WrenchIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import CloseAccountModal from '../modals/CloseAccountModal'
import AccountNameModal from '../modals/AccountNameModal'
import { copyToClipboard } from 'utils'
import { notify } from 'utils/notifications'
import { abbreviateAddress } from 'utils/formatting'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import DelegateModal from '@components/modals/DelegateModal'
import useMangoAccount from 'hooks/useMangoAccount'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'
import { useWallet } from '@solana/wallet-adapter-react'
import CreateAccountModal from '@components/modals/CreateAccountModal'
import { Popover, Transition } from '@headlessui/react'
import ActionsLinkButton from './ActionsLinkButton'
import useUnownedAccount from 'hooks/useUnownedAccount'

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
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const [showCloseAccountModal, setShowCloseAccountModal] = useState(false)
  const [showEditAccountModal, setShowEditAccountModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [showDelegateModal, setShowDelegateModal] = useState(false)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const { connected } = useWallet()
  const { isUnownedAccount } = useUnownedAccount()

  const handleBorrowModal = () => {
    if (mangoAccountAddress || !connected) {
      setShowBorrowModal(true)
    } else {
      setShowCreateAccountModal(true)
    }
  }

  return (
    <>
      {isUnownedAccount ? null : (
        <div className="flex items-center space-x-2">
          <Button
            className="flex w-1/3 items-center justify-center md:w-auto"
            disabled={!mangoAccountAddress}
            onClick={() => setShowRepayModal(true)}
            secondary
          >
            <ArrowDownRightIcon className="mr-2 h-5 w-5" />
            {t('repay')}
          </Button>
          <Button
            className="flex w-1/3 items-center justify-center md:w-auto"
            onClick={handleBorrowModal}
            secondary
          >
            <ArrowUpLeftIcon className="mr-2 h-5 w-5" />
            {t('borrow')}
          </Button>
          <Popover className="relative w-1/3 md:w-auto">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`w-full focus:outline-none`}
                  as="div"
                >
                  <Button
                    className="flex w-full items-center justify-center"
                    secondary
                  >
                    <WrenchIcon className="mr-2 h-4 w-4" />
                    {t('actions')}
                  </Button>
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
                      onClick={() =>
                        handleCopyAddress(
                          mangoAccount!,
                          t('copy-address-success', {
                            pk: abbreviateAddress(mangoAccount!.publicKey),
                          })
                        )
                      }
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      <span className="ml-2">{t('copy-address')}</span>
                    </ActionsLinkButton>
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
      {showBorrowModal ? (
        <BorrowRepayModal
          action="borrow"
          isOpen={showBorrowModal}
          onClose={() => setShowBorrowModal(false)}
        />
      ) : null}
      {showRepayModal ? (
        <BorrowRepayModal
          action="repay"
          isOpen={showRepayModal}
          onClose={() => setShowRepayModal(false)}
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
