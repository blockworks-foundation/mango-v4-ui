import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useState } from 'react'
import TabUnderline from '@components/shared/TabUnderline'
import BorrowForm from '@components/BorrowForm'
import RepayForm from '@components/RepayForm'
import { ACCOUNT_ACTION_MODAL_HEIGHT } from 'utils/constants'

interface BorrowRepayModalProps {
  action: 'borrow' | 'repay'
  token?: string
}

type ModalCombinedProps = BorrowRepayModalProps & ModalProps

const BorrowRepayModal = ({
  action,
  isOpen,
  onClose,
  token,
}: ModalCombinedProps) => {
  const [activeTab, setActiveTab] = useState(action)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ height: ACCOUNT_ACTION_MODAL_HEIGHT }}>
        <div className="pb-2">
          <TabUnderline
            activeValue={activeTab}
            values={['borrow', 'repay']}
            onChange={(v) => setActiveTab(v)}
          />
        </div>
        {activeTab === 'borrow' ? (
          <BorrowForm onSuccess={onClose} token={token} />
        ) : null}
        {activeTab === 'repay' ? (
          <RepayForm onSuccess={onClose} token={token} />
        ) : null}
      </div>
    </Modal>
  )
}

export default BorrowRepayModal
