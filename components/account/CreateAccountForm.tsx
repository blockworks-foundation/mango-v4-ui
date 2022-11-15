import { ChangeEvent, useMemo, useState } from 'react'
import { useTranslation } from 'next-i18next'
import mangoStore from '@store/mangoStore'
import { notify } from '../../utils/notifications'
import Button, { IconButton } from '../shared/Button'
import BounceLoader from '../shared/BounceLoader'
import Input from '../forms/Input'
import Label from '../forms/Label'
import { useWallet } from '@solana/wallet-adapter-react'
import InlineNotification from '../shared/InlineNotification'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { TokenInstructions } from '@project-serum/serum'
import { MIN_SOL_BALANCE } from 'utils/constants'

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
  const walletTokens = mangoStore((s) => s.wallet.tokens)

  const solBalance = useMemo(() => {
    return (
      walletTokens.find((t) =>
        t.mint.equals(TokenInstructions.WRAPPED_SOL_MINT)
      )?.uiAmount || 0
    )
  }, [walletTokens])

  const handleNewAccount = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccounts = mangoStore.getState().mangoAccounts
    const set = mangoStore.getState().set
    if (!group || !wallet) return
    setLoading(true)
    try {
      const newAccountNum = getNextAccountNumber(mangoAccounts)
      const tx = await client.createMangoAccount(
        group,
        newAccountNum,
        name || `Account ${newAccountNum + 1}`,
        undefined, // tokenCount
        undefined, // serum3Count
        8, // perpCount
        8 // perpOoCount
      )
      if (tx) {
        const pk = wallet!.adapter.publicKey
        const mangoAccounts = await client.getMangoAccountsForOwner(group, pk!)
        const reloadedMangoAccounts = await Promise.all(
          mangoAccounts.map((ma) => ma.reloadAccountData(client))
        )
        const newAccount = mangoAccounts.find(
          (acc) => acc.accountNum === newAccountNum
        )
        if (newAccount) {
          await newAccount.reloadAccountData(client)
          set((s) => {
            s.mangoAccount.current = newAccount
            s.mangoAccounts = reloadedMangoAccounts
          })
        }
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
      <div className="space-y-4">
        <InlineNotification type="info" desc={t('insufficient-sol')} />
        <Button
          className="w-full"
          disabled={solBalance < MIN_SOL_BALANCE}
          onClick={handleNewAccount}
          size="large"
        >
          {t('create-account')}
        </Button>
        {solBalance < MIN_SOL_BALANCE ? (
          <InlineNotification type="error" desc={t('deposit-more-sol')} />
        ) : null}
      </div>
    </div>
  )
}

export default CreateAccountForm
