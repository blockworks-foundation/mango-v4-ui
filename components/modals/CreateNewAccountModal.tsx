import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '../../store/state'
import { notify } from '../../utils/notifications'
import Button from '../shared/Button'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useState } from 'react'
import BounceLoader from '../shared/BounceLoader'
import Input from '../forms/Input'
import Label from '../forms/Label'

const CreateNewAccountModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('common')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')

  // This doesn't work yet...
  const handleNewAccount = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    if (!group) return
    setLoading(true)
    try {
      const tx = await client.createMangoAccount(group, 0, name)
      if (tx) {
        setLoading(false)
        onClose()
        notify({
          title: t('new-account-success'),
          type: 'success',
          txid: tx,
        })
      }
    } catch (e) {
      setLoading(false)
      notify({
        title: t('new-account-failed'),
        type: 'error',
      })
      console.log(e)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-64">
        {loading ? (
          <BounceLoader loadingMessage={t('creating-account')} />
        ) : (
          <div className="flex h-full flex-col justify-between">
            <div className="pb-4">
              <h2 className="mb-4">{t('new-account')}</h2>
              <Label optional text={t('account-name')} />
              <Input
                type="text"
                name="name"
                id="name"
                placeholder="0.00"
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </div>
            <Button className="w-full" onClick={handleNewAccount} size="large">
              {t('create-account')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default CreateNewAccountModal
