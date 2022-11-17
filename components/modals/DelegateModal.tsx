import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '@store/mangoStore'
import { notify } from '../../utils/notifications'
import Button from '../shared/Button'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useState } from 'react'
import Input from '../forms/Input'
import Label from '../forms/Label'
import { PublicKey } from '@solana/web3.js'

const DelegateModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const [loading, setLoading] = useState(false)
  console.log('mad', mangoAccount?.delegate?.toString())

  const [delegateAddress, setDelegateAddress] = useState(
    mangoAccount?.delegate?.toString() !== '11111111111111111111111111111111'
      ? mangoAccount?.delegate?.toString()
      : ''
  )

  // This doesn't work yet...
  const handleUpdateccountName = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    if (!mangoAccount || !group) return

    if (
      delegateAddress &&
      delegateAddress !== '' &&
      !PublicKey.isOnCurve(delegateAddress)
    ) {
      notify({
        type: 'error',
        title: 'Not a valid delegate address',
        description: 'Enter the public key of the delegate wallet',
      })
    }

    setLoading(true)
    try {
      const tx = await client.editMangoAccount(
        group,
        mangoAccount,
        undefined,
        delegateAddress ? new PublicKey(delegateAddress) : undefined
      )

      setLoading(false)
      onClose()
      notify({
        title: t('account-update-success'),
        type: 'success',
        txid: tx,
      })
      await actions.reloadMangoAccount()
    } catch (e: any) {
      setLoading(false)
      notify({
        title: t('account-update-failed'),
        txid: e?.signature,
        type: 'error',
      })
      console.error(e)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-64">
        <div className="flex h-full flex-col justify-between">
          <div className="pb-4">
            <h2 className="mb-1">{t('delegate-account')}</h2>
            <p className="mb-4">{t('delegate-desc')}</p>
            <Label text={t('wallet-address')} />
            <Input
              type="text"
              name="name"
              id="name"
              placeholder={t('delegate-placeholder')}
              value={delegateAddress}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDelegateAddress(e.target.value)
              }
            />
          </div>
          <Button
            className="w-full"
            onClick={handleUpdateccountName}
            size="large"
          >
            {t('update')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default DelegateModal
