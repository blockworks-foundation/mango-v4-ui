import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useEffect, useState } from 'react'
import TabUnderline from '@components/shared/TabUnderline'
import DepositForm from '@components/DepositForm'
import WithdrawForm from '@components/WithdrawForm'
import mangoStore from '@store/mangoStore'
import { useWallet } from '@solana/wallet-adapter-react'
import useUnownedAccount from 'hooks/useUnownedAccount'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import BridgeModal from './BridgeModal'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation('common')
  const [activeTab, setActiveTab] = useState(action)
  const [showBridgeModal, setShowBridgeModal] = useState(false)
  const { publicKey: walletPk } = useWallet()
  const { isDelegatedAccount } = useUnownedAccount()

  useEffect(() => {
    if (walletPk) {
      mangoStore.getState().actions.fetchWalletTokens(walletPk)
    }
  }, [walletPk])

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div style={{ height: '598px' }}>
          {!isDelegatedAccount ? (
            <>
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
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-th-fgd-4">
                Unavailable for delegate accounts
              </div>
            </div>
          )}
        </div>
        {activeTab === 'deposit' ? (
          <button
            className="mt-4 flex w-full items-center justify-between rounded-md border border-th-bkg-4 px-4 py-2 text-left font-bold text-th-fgd-2 focus:outline-none md:hover:border-th-fgd-4"
            onClick={() => setShowBridgeModal(true)}
          >
            <span>{t('bridge-wormhole')}</span>
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        ) : null}
      </Modal>
      {showBridgeModal ? (
        <BridgeModal
          isOpen={showBridgeModal}
          onClose={() => setShowBridgeModal(false)}
        />
      ) : null}
    </>
  )
}

export default DepositWithdrawModal
