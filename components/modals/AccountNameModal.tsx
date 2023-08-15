import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '@store/mangoStore'
import { notify } from '../../utils/notifications'
import Button from '../shared/Button'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useCallback, useState } from 'react'
import BounceLoader from '../shared/BounceLoader'
import Input from '../forms/Input'
import Label from '../forms/Label'
import useMangoAccount from 'hooks/useMangoAccount'
import { isMangoError } from 'types'

const AccountNameModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('common')
  const { mangoAccount } = useMangoAccount()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(mangoAccount?.name || '')

  const handleUpdateccountName = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    if (!mangoAccount || !group) return
    setLoading(true)
    try {
      const { signature: tx, slot } = await client.editMangoAccount(
        group,
        mangoAccount,
        name,
      )

      setLoading(false)
      onClose()
      notify({
        title: t('account-update-success'),
        type: 'success',
        txid: tx,
      })
      await actions.reloadMangoAccount(slot)
    } catch (e) {
      console.error(e)
      setLoading(false)
      if (!isMangoError(e)) return
      notify({
        title: t('account-update-failed'),
        txid: e?.txid,
        type: 'error',
      })
    }
  }, [mangoAccount, name, t, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-64">
        {loading ? (
          <BounceLoader loadingMessage={t('updating-account-name')} />
        ) : (
          <div className="flex h-full flex-col justify-between">
            <div className="pb-4">
              <h2 className="mb-1">{t('edit-account')}</h2>
              <p className="mb-4">{t('account-name-desc')}</p>
              <Label text={t('account-name')} />
              <Input
                type="text"
                name="name"
                id="name"
                placeholder="e.g. Sweet Caroline"
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                maxLength={30}
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
        )}
      </div>
    </Modal>
  )
}

export default AccountNameModal
