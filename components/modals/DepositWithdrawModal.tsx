import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useState } from 'react'
import TabUnderline from '@components/shared/TabUnderline'
import DepositForm from '@components/DepositForm'
import WithdrawForm from '@components/WithdrawForm'

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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-[448px]">
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
