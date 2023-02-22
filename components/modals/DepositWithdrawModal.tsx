import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useEffect, useState } from 'react'
import TabUnderline from '@components/shared/TabUnderline'
import DepositForm from '@components/DepositForm'
import WithdrawForm from '@components/WithdrawForm'
import { ACCOUNT_ACTION_MODAL_HEIGHT } from 'utils/constants'
import mangoStore from '@store/mangoStore'
import { useWallet } from '@solana/wallet-adapter-react'

interface DepositWithdrawModalProps {
  action: 'deposit' | 'withdraw'
  token?: string
}

type ModalCombinedProps = DepositWithdrawModalProps & ModalProps

const DepositWithdrawModal = ({
  action,
  isOpen,
  onClose,
  token,
}: ModalCombinedProps) => {
  const [activeTab, setActiveTab] = useState(action)
  const { publicKey: walletPk } = useWallet()

  useEffect(() => {
    if (walletPk) {
      mangoStore.getState().actions.fetchWalletTokens(walletPk)
    }
  }, [walletPk])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ height: ACCOUNT_ACTION_MODAL_HEIGHT }}>
        <div className="pb-2">
          <TabUnderline
            activeValue={activeTab}
            values={['deposit', 'withdraw']}
            onChange={(v) => setActiveTab(v)}
          />
        </div>
        {activeTab === 'deposit' ? (
          <DepositForm onSuccess={onClose} token={token} />
        ) : null}
        {activeTab === 'withdraw' ? (
          <WithdrawForm onSuccess={onClose} token={token} />
        ) : null}
      </div>
    </Modal>
  )
}

export default DepositWithdrawModal
