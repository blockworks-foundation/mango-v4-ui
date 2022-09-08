import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import Button, { LinkButton } from '../shared/Button'
import DepositModal from '../modals/DepositModal'
import WithdrawModal from '../modals/WithdrawModal'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import IconDropMenu from '../shared/IconDropMenu'
import CloseAccountModal from '../modals/CloseAccountModal'
import AccountNameModal from '../modals/AccountNameModal'

const AccountActions = () => {
  const { t } = useTranslation(['common', 'close-account'])
  const { connected } = useWallet()
  const [showCloseAccountModal, setShowCloseAccountModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showEditAccountModal, setShowEditAccountModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  return (
    <>
      <div className="flex space-x-3">
        <Button
          className="flex items-center"
          disabled={!connected}
          onClick={() => setShowDepositModal(true)}
          size="large"
        >
          <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
          {t('deposit')}
        </Button>
        <Button
          className="flex items-center"
          disabled={!connected}
          onClick={() => setShowWithdrawModal(true)}
          secondary
          size="large"
        >
          <ArrowUpTrayIcon className="mr-2 h-5 w-5" />
          {t('withdraw')}
        </Button>
        <IconDropMenu
          icon={<EllipsisHorizontalIcon className="h-5 w-5" />}
          large
        >
          <LinkButton
            className="whitespace-nowrap"
            disabled={!connected}
            onClick={() => setShowEditAccountModal(true)}
          >
            <PencilIcon className="h-5 w-5" />
            <span className="ml-2">{t('edit-account')}</span>
          </LinkButton>
          <LinkButton
            className="whitespace-nowrap"
            disabled={!connected}
            onClick={() => setShowCloseAccountModal(true)}
          >
            <TrashIcon className="h-5 w-5" />
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
    </>
  )
}

export default AccountActions
