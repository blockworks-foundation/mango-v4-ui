import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '../../store/state'
import { notify } from '../../utils/notifications'
import { useWallet } from '@solana/wallet-adapter-react'
import Button from '../shared/Button'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import BounceLoader from '../shared/BounceLoader'

const CloseAccountModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('common')
  const { disconnect } = useWallet()
  const [loading, setLoading] = useState(false)

  const handleCloseMangoAccount = async () => {
    const client = mangoStore.getState().client
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const group = mangoStore.getState().group
    if (!mangoAccount || !group) return
    setLoading(true)
    try {
      const tx = await client.closeMangoAccount(group, mangoAccount)
      if (tx) {
        disconnect()
        setLoading(false)
        onClose()
        notify({
          title: t('account-closed'),
          type: 'success',
          txid: tx,
        })
      }
    } catch (e) {
      setLoading(false)
      console.log(e)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-56">
        {loading ? (
          <BounceLoader loadingMessage={t('closing-account')} />
        ) : (
          <div className="flex h-full flex-col justify-between">
            <div className="pb-6">
              <h2 className="mb-1">{t('close-account')}</h2>
              <p>Are you sure? Closing your account is irreversible.</p>
            </div>
            <Button
              className="w-full"
              onClick={handleCloseMangoAccount}
              size="large"
            >
              {t('close-account')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default CloseAccountModal
