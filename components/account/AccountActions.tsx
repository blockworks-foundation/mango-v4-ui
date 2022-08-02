import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import Button, { LinkButton } from '../shared/Button'
import DepositModal from '../modals/DepositModal'
import WithdrawModal from '../modals/WithdrawModal'
import mangoStore from '../../store/state'
import {
  DotsHorizontalIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from '@heroicons/react/solid'
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

  const handleCloseMangoAccount = async () => {
    const client = mangoStore.getState().client
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const group = mangoStore.getState().group
    if (!mangoAccount || !group) return
    try {
      const tx = await client.closeMangoAccount(group, mangoAccount)
      console.log('success:', tx)
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <>
      <div className="flex space-x-3">
        <Button
          disabled={!connected}
          onClick={() => setShowDepositModal(true)}
          size="large"
        >
          {t('deposit')}
        </Button>
        <Button
          disabled={!connected}
          onClick={() => setShowWithdrawModal(true)}
          secondary
          size="large"
        >
          {t('withdraw')}
        </Button>
        <IconDropMenu icon={<DotsHorizontalIcon className="h-5 w-5" />} large>
          <LinkButton
            className="flex items-center whitespace-nowrap"
            disabled={!connected}
            icon={<PencilIcon className="h-5 w-5" />}
            onClick={() => setShowEditAccountModal(true)}
          >
            {t('edit-account')}
          </LinkButton>
          <LinkButton
            className="flex items-center whitespace-nowrap"
            disabled={!connected}
            icon={<TrashIcon className="h-5 w-5" />}
            onClick={() => setShowCloseAccountModal(true)}
          >
            {t('close-account')}
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
