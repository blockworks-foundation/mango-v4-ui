import { useMemo, useState } from 'react'
import Button, { LinkButton } from '../shared/Button'
import {
  ArrowDownRightIcon,
  ArrowUpLeftIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import IconDropMenu from '../shared/IconDropMenu'
import CloseAccountModal from '../modals/CloseAccountModal'
import AccountNameModal from '../modals/AccountNameModal'
import { copyToClipboard } from 'utils'
import { notify } from 'utils/notifications'
import { abbreviateAddress } from 'utils/formatting'
import {
  HealthType,
  MangoAccount,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import DelegateModal from '@components/modals/DelegateModal'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'

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
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const [showCloseAccountModal, setShowCloseAccountModal] = useState(false)
  const [showEditAccountModal, setShowEditAccountModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [showDelegateModal, setShowDelegateModal] = useState(false)

  const hasBorrows = useMemo(() => {
    if (!mangoAccount || !group) return false
    return (
      toUiDecimalsForQuote(
        mangoAccount.getLiabsValue(group, HealthType.init).toNumber()
      ) >= 1
    )
  }, [mangoAccount, group])

  return (
    <>
      <div className="flex items-center space-x-2 md:space-x-3">
        {hasBorrows ? (
          <Button
            className="flex items-center"
            disabled={!mangoAccount}
            onClick={() => setShowRepayModal(true)}
          >
            <ArrowDownRightIcon className="mr-2 h-5 w-5" />
            {t('repay')}
          </Button>
        ) : null}
        <Button
          className="flex items-center"
          disabled={!mangoAccount}
          onClick={() => setShowBorrowModal(true)}
          secondary={hasBorrows}
        >
          <ArrowUpLeftIcon className="mr-2 h-5 w-5" />
          {t('borrow')}
        </Button>
        <IconDropMenu
          icon={<EllipsisHorizontalIcon className="h-5 w-5" />}
          size="medium"
        >
          <LinkButton
            className="whitespace-nowrap font-normal no-underline md:hover:text-th-fgd-1"
            disabled={!mangoAccount}
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
          </LinkButton>
          <LinkButton
            className="whitespace-nowrap font-normal no-underline md:hover:text-th-fgd-1"
            disabled={!mangoAccount}
            onClick={() => setShowEditAccountModal(true)}
          >
            <PencilIcon className="h-4 w-4" />
            <span className="ml-2">{t('edit-account')}</span>
          </LinkButton>
          <LinkButton
            className="whitespace-nowrap font-normal no-underline md:hover:text-th-fgd-1"
            disabled={!mangoAccount}
            onClick={() => setShowDelegateModal(true)}
          >
            <UsersIcon className="h-4 w-4" />
            <span className="ml-2">{t('delegate-account')}</span>
          </LinkButton>
          <LinkButton
            className="whitespace-nowrap font-normal no-underline md:hover:text-th-fgd-1"
            disabled={!mangoAccount}
            onClick={() => setShowCloseAccountModal(true)}
          >
            <TrashIcon className="h-4 w-4" />
            <span className="ml-2">{t('close-account')}</span>
          </LinkButton>
        </IconDropMenu>
      </div>
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
    </>
  )
}

export default AccountActions
