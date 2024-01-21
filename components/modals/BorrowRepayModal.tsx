import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useEffect, useState } from 'react'
import TabUnderline from '@components/shared/TabUnderline'
import BorrowForm from '@components/BorrowForm'
import RepayForm from '@components/RepayForm'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import useUnownedAccount from 'hooks/useUnownedAccount'

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
  const { publicKey: walletPk } = useWallet()
  const { isDelegatedAccount } = useUnownedAccount()

  useEffect(() => {
    if (walletPk) {
      mangoStore.getState().actions.fetchWalletTokens(walletPk)
    }
  }, [walletPk])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ height: '498px' }}>
        {!isDelegatedAccount ? (
          <>
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
            ) : null}{' '}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-th-fgd-4">
              Unavailable for delegate accounts
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default BorrowRepayModal
