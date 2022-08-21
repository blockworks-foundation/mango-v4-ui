import { ChangeEvent, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '../../store/mangoStore'
import { notify } from '../../utils/notifications'
import Button from '../shared/Button'
import BounceLoader from '../shared/BounceLoader'
import Input from '../forms/Input'
import Label from '../forms/Label'
import { useWallet } from '@solana/wallet-adapter-react'
import { Wallet } from '@project-serum/anchor'
import InlineNotification from '../shared/InlineNotification'
import { MangoAccount } from '@blockworks-foundation/mango-v4'

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

interface CreateAccountModalProps {
  isFirstAccount?: boolean
}

type ModalCombinedProps = ModalProps & CreateAccountModalProps

const CreateAccountModal = ({
  isFirstAccount,
  isOpen,
  onClose,
}: ModalCombinedProps) => {
  const { t } = useTranslation('common')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const { wallet } = useWallet()

  const handleNewAccount = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccounts = mangoStore.getState().mangoAccounts.accounts
    const actions = mangoStore.getState().actions
    if (!group || !wallet) return
    setLoading(true)
    try {
      const newAccountNum = getNextAccountNumber(mangoAccounts)
      const tx = await client.createMangoAccount(
        group,
        newAccountNum,
        name || `Account ${newAccountNum + 1}`
      )
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
      console.error(e)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-80">
        {loading ? (
          <BounceLoader loadingMessage={t('creating-account')} />
        ) : (
          <div className="flex h-full flex-col justify-between">
            <div className="pb-4">
              <h2>{t('create-account')}</h2>
              {isFirstAccount ? (
                <p className="mt-1">You need a Mango Account to get started.</p>
              ) : null}
              <div className="pt-4">
                <Label optional text={t('account-name')} />
              </div>
              <Input
                type="text"
                name="name"
                id="name"
                placeholder="Account"
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </div>
            <div className="space-y-6">
              <InlineNotification type="info" desc={t('insufficient-sol')} />
              <Button
                className="w-full"
                onClick={handleNewAccount}
                size="large"
              >
                {t('create-account')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default CreateAccountModal
