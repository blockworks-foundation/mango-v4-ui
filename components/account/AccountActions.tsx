import { useMemo, useState } from 'react'
import Button, { LinkButton } from '../shared/Button'
import DepositModal from '../modals/DepositModal'
import WithdrawModal from '../modals/WithdrawModal'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BanknotesIcon,
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
import mangoStore from '@store/mangoStore'
import { copyToClipboard } from 'utils'
import { notify } from 'utils/notifications'
import { abbreviateAddress } from 'utils/formatting'
import { HealthType, ZERO_I80F48 } from '@blockworks-foundation/mango-v4'
import RepayModal from '@components/modals/RepayModal'
import DelegateModal from '@components/modals/DelegateModal'

const AccountActions = () => {
  const { t } = useTranslation(['common', 'close-account'])
  const group = mangoStore((s) => s.group)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const [showCloseAccountModal, setShowCloseAccountModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showEditAccountModal, setShowEditAccountModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [showDelegateModal, setShowDelegateModal] = useState(false)

  const handleCopyAddress = (address: string) => {
    copyToClipboard(address)
    notify({
      title: t('copy-address-success', {
        pk: abbreviateAddress(mangoAccount!.publicKey),
      }),
      type: 'success',
    })
  }

  const hasBorrows = useMemo(() => {
    return mangoAccount && group
      ? !mangoAccount.getLiabsValue(group, HealthType.init).eq(ZERO_I80F48())
      : false
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
            <BanknotesIcon className="mr-2 h-5 w-5" />
            {t('repay')}
          </Button>
        ) : null}
        <Button
          className="flex items-center"
          disabled={!mangoAccount}
          onClick={() => setShowDepositModal(true)}
          secondary={hasBorrows}
        >
          <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
          {t('deposit')}
        </Button>
        <Button
          className="flex items-center"
          disabled={!mangoAccount}
          onClick={() => setShowWithdrawModal(true)}
          secondary
        >
          <ArrowUpTrayIcon className="mr-2 h-5 w-5" />
          {t('withdraw')}
        </Button>
        <IconDropMenu
          icon={<EllipsisHorizontalIcon className="h-5 w-5" />}
          size="medium"
        >
          <LinkButton
            className="whitespace-nowrap"
            disabled={!mangoAccount}
            onClick={() =>
              handleCopyAddress(mangoAccount!.publicKey.toString())
            }
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            <span className="ml-2">{t('copy-address')}</span>
          </LinkButton>
          <LinkButton
            className="whitespace-nowrap"
            disabled={!mangoAccount}
            onClick={() => setShowEditAccountModal(true)}
          >
            <PencilIcon className="h-4 w-4" />
            <span className="ml-2">{t('edit-account')}</span>
          </LinkButton>
          <LinkButton
            className="whitespace-nowrap"
            disabled={!mangoAccount}
            onClick={() => setShowDelegateModal(true)}
          >
            <UsersIcon className="h-4 w-4" />
            <span className="ml-2">{t('delegate-account')}</span>
          </LinkButton>
          <LinkButton
            className="whitespace-nowrap"
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
      {showDepositModal ? (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
        />
      ) : null}
      {showEditAccountModal ? (
        <AccountNameModal
          isOpen={showEditAccountModal}
          onClose={() => setShowEditAccountModal(false)}
        />
      ) : null}
      {showWithdrawModal ? (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
        />
      ) : null}

      {showRepayModal ? (
        <RepayModal
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
