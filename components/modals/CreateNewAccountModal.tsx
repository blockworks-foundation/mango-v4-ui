import { ChangeEvent, useState } from 'react'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '../../store/state'
import { notify } from '../../utils/notifications'
import Button from '../shared/Button'
import BounceLoader from '../shared/BounceLoader'
import Input from '../forms/Input'
import Label from '../forms/Label'
import { useWallet } from '@solana/wallet-adapter-react'
import { Wallet } from '@project-serum/anchor'

const getNextAccountNumber = (accounts: MangoAccount[]): number => {
  if (accounts.length > 1) {
    return (
      accounts
        .map((a) => a.accountNum)
        .reduce((a, b) => Math.max(a, b), -Infinity) + 1
    )
  } else if (accounts.length === 1) {
    return accounts[0].accountNum + 1
  }
  return 0
}

const CreateNewAccountModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('common')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const { wallet } = useWallet()

  // This doesn't work yet...
  const handleNewAccount = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccounts = mangoStore.getState().mangoAccounts
    const actions = mangoStore.getState().actions
    if (!group || !wallet) return
    setLoading(true)
    try {
      const newAccountNum = getNextAccountNumber(mangoAccounts)
      const tx = await client.createMangoAccount(group, newAccountNum, name)
      actions.fetchMangoAccounts(wallet!.adapter as unknown as Wallet)
      if (tx) {
        setLoading(false)
        onClose()
        notify({
          title: t('new-account-success'),
          type: 'success',
          txid: tx,
        })
      }
    } catch (e: any) {
      setLoading(false)
      notify({
        title: t('new-account-failed'),
        txid: e?.signature,
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
                placeholder="Account 1"
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
