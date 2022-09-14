import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '@store/mangoStore'
import { notify } from '../../utils/notifications'
import { useWallet } from '@solana/wallet-adapter-react'
import Button from '../shared/Button'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import BounceLoader from '../shared/BounceLoader'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import { TrashIcon } from '@heroicons/react/20/solid'

const CloseAccountModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('common')
  const { wallet } = useWallet()
  const [loading, setLoading] = useState(false)
  const set = mangoStore((s) => s.set)

  const handleCloseMangoAccount = async () => {
    const client = mangoStore.getState().client
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const mangoAccounts = mangoStore.getState().mangoAccounts.accounts
    const group = mangoStore.getState().group
    if (!mangoAccount || !group) return
    setLoading(true)
    try {
      const tx = await client.closeMangoAccount(group, mangoAccount)
      if (tx) {
        const newMangoAccounts = mangoAccounts.filter(
          (ma) => !ma.publicKey.equals(mangoAccount.publicKey)
        )
        let newCurrentAccount: MangoAccount
        if (newMangoAccounts[0]) {
          newCurrentAccount = await newMangoAccounts[0].reload(client, group)
        }

        setLoading(false)
        onClose()
        notify({
          title: t('account-closed'),
          type: 'success',
          txid: tx,
        })
        set((state) => {
          state.mangoAccounts.accounts = newMangoAccounts
          state.mangoAccount.current = newCurrentAccount
          state.mangoAccount.lastUpdatedAt = new Date().toISOString()
        })
      }
    } catch (e) {
      setLoading(false)
      console.error(e)
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
              <p>{t('close-account-desc')}</p>
            </div>
            <Button
              className="w-full"
              onClick={handleCloseMangoAccount}
              size="large"
            >
              <div className="flex items-center justify-center">
                <TrashIcon className="mr-2 h-5 w-5" />
                {t('close-account')}
              </div>
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default CloseAccountModal
