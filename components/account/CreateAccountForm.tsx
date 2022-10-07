import { ChangeEvent, useState } from 'react'
import { useTranslation } from 'next-i18next'
import mangoStore from '@store/mangoStore'
import { notify } from '../../utils/notifications'
import Button, { IconButton } from '../shared/Button'
import BounceLoader from '../shared/BounceLoader'
import Input from '../forms/Input'
import Label from '../forms/Label'
import { useWallet } from '@solana/wallet-adapter-react'
import { Wallet } from '@project-serum/anchor'
import InlineNotification from '../shared/InlineNotification'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'

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

const CreateAccountForm = ({
  isFirstAccount,
  customClose,
  handleBack,
}: {
  isFirstAccount?: boolean
  customClose?: () => void
  handleBack?: () => void
}) => {
  const { t } = useTranslation('common')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const { wallet } = useWallet()
  const mangoAccounts = mangoStore((s) => s.mangoAccounts)

  const handleNewAccount = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const set = mangoStore.getState().set
    if (!group || !wallet) return
    setLoading(true)
    try {
      const newAccountNum = getNextAccountNumber(mangoAccounts)
      const tx = await client.createMangoAccount(
        group,
        newAccountNum,
        name || `Account ${newAccountNum + 1}`
      )
      if (tx) {
        await actions.fetchMangoAccounts(wallet!.adapter as unknown as Wallet)
        const newAccount = mangoAccounts.find(
          (acc) => acc.accountNum === newAccountNum
        )
        set((s) => {
          s.mangoAccount.current = newAccount
        })
        setLoading(false)
        notify({
          title: t('new-account-success'),
          type: 'success',
          txid: tx,
        })
        if (customClose) {
          customClose()
        }
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

  return loading ? (
    <div className="flex h-full flex-col items-center justify-between">
      <BounceLoader loadingMessage={t('creating-account')} />
    </div>
  ) : (
    <div className="flex h-full flex-col justify-between">
      <div className="pb-4">
        <div className="flex items-center">
          {handleBack ? (
            <IconButton className="mr-3" onClick={handleBack} size="small">
              <ArrowLeftIcon className="h-5 w-5" />
            </IconButton>
          ) : null}
          <h2>{t('create-account')}</h2>
        </div>
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
        <Button className="w-full" onClick={handleNewAccount} size="large">
          {t('create-account')}
        </Button>
      </div>
    </div>
  )
}

export default CreateAccountForm
