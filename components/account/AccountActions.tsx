import { useState } from 'react'
import { useTranslation } from 'next-i18next'
import { copyToClipboard } from 'utils'
import { notify } from 'utils/notifications'
import useMangoAccount from 'hooks/useMangoAccount'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'
import { useWallet } from '@solana/wallet-adapter-react'
import CreateAccountModal from '@components/modals/CreateAccountModal'
import useUnownedAccount from 'hooks/useUnownedAccount'
import DepositWithdrawModal from '@components/modals/DepositWithdrawModal'
import {
  ArrowDownRightIcon,
  ArrowDownTrayIcon,
  ArrowUpLeftIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/20/solid'

export const handleCopyAddress = (
  mangoAccountAddress: string,
  successMessage: string,
) => {
  copyToClipboard(mangoAccountAddress)
  notify({
    title: successMessage,
    type: 'success',
  })
}

type ActionType = 'deposit' | 'withdraw' | 'borrow' | 'repay'

const ACTION_BUTTON_CLASSES =
  'flex h-10 items-center justify-center space-x-1 sm:space-x-2 font-bold focus:outline-none md:hover:bg-th-bkg-2 text-xs sm:text-sm'

const ACTION_BUTTON_ICON_CLASSES = 'h-3.5 w-3.5 sm:h-5 sm:w-5'

const AccountActions = () => {
  const { t } = useTranslation(['common', 'close-account', 'settings'])
  const { mangoAccountAddress } = useMangoAccount()
  const [modalToShow, setModalToShow] = useState('')
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const { connected } = useWallet()
  const { isUnownedAccount } = useUnownedAccount()

  const handleActionModal = (type: ActionType) => {
    if (mangoAccountAddress || !connected) {
      setModalToShow(type)
    } else {
      setShowCreateAccountModal(true)
    }
  }

  return (
    <>
      {isUnownedAccount ? null : (
        <div className="grid grid-cols-4 border-t border-th-bkg-3">
          <button
            className={`${ACTION_BUTTON_CLASSES} border-r border-th-bkg-3`}
            onClick={() => handleActionModal('deposit')}
          >
            <ArrowDownTrayIcon className={ACTION_BUTTON_ICON_CLASSES} />
            <span>{t('deposit')}</span>
          </button>
          <button
            className={`${ACTION_BUTTON_CLASSES} border-r border-th-bkg-3`}
            onClick={() => handleActionModal('withdraw')}
          >
            <ArrowUpTrayIcon className={ACTION_BUTTON_ICON_CLASSES} />
            <span>{t('withdraw')}</span>
          </button>
          <button
            className={`${ACTION_BUTTON_CLASSES} border-r border-th-bkg-3`}
            onClick={() => handleActionModal('borrow')}
          >
            <ArrowUpLeftIcon className={ACTION_BUTTON_ICON_CLASSES} />
            <span>{t('borrow')}</span>
          </button>
          <button
            className={ACTION_BUTTON_CLASSES}
            onClick={() => handleActionModal('repay')}
          >
            <ArrowDownRightIcon className={ACTION_BUTTON_ICON_CLASSES} />
            <span>{t('repay')}</span>
          </button>
        </div>
      )}
      {modalToShow === 'deposit' ? (
        <DepositWithdrawModal
          action="deposit"
          isOpen={modalToShow === 'deposit'}
          onClose={() => setModalToShow('')}
        />
      ) : null}
      {modalToShow === 'withdraw' ? (
        <DepositWithdrawModal
          action="withdraw"
          isOpen={modalToShow === 'withdraw'}
          onClose={() => setModalToShow('')}
        />
      ) : null}
      {modalToShow === 'borrow' ? (
        <BorrowRepayModal
          action="borrow"
          isOpen={modalToShow === 'borrow'}
          onClose={() => setModalToShow('')}
        />
      ) : null}
      {modalToShow === 'repay' ? (
        <BorrowRepayModal
          action="repay"
          isOpen={modalToShow === 'repay'}
          onClose={() => setModalToShow('')}
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
