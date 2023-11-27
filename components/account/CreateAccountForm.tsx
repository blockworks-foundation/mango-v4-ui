import { ChangeEvent, useState } from 'react'
import { useTranslation } from 'next-i18next'
import mangoStore from '@store/mangoStore'
import { createSolanaMessage, notify } from '../../utils/notifications'
import Button, { IconButton } from '../shared/Button'
import BounceLoader from '../shared/BounceLoader'
import Input from '../forms/Input'
import Label from '../forms/Label'
import { useWallet } from '@solana/wallet-adapter-react'
import InlineNotification from '../shared/InlineNotification'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import useSolBalance from 'hooks/useSolBalance'
import { isMangoError } from 'types'
import { MAX_ACCOUNTS } from 'utils/constants'
import Switch from '@components/forms/Switch'
import NotificationCookieStore from '@store/notificationCookieStore'
import { usePlausible } from 'next-plausible'
import { TelemetryEvents } from 'utils/telemetry'
import { waitForSlot } from 'utils/network'

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
  customClose,
  handleBack,
}: {
  customClose?: () => void
  handleBack?: () => void
}) => {
  const { t } = useTranslation('common')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [signToNotifications, setSignToNotifications] = useState(true)
  //whole context needed to sign msgs
  const walletContext = useWallet()
  const { maxSolDeposit } = useSolBalance()
  const telemetry = usePlausible<TelemetryEvents>()
  const setCookie = NotificationCookieStore((s) => s.setCookie)

  const handleNewAccount = async () => {
    const client = mangoStore.getState().readClient
    const group = mangoStore.getState().group
    const existingMangoAccts = mangoStore.getState().mangoAccounts
    const set = mangoStore.getState().set
    const connection = mangoStore.getState().connection

    if (!group || !walletContext.wallet) return
    setLoading(true)
    try {
      const newAccountNum = getNextAccountNumber(existingMangoAccts)
      const { signature: tx, slot } = await client.createMangoAccount(
        group,
        newAccountNum,
        name || `Account ${newAccountNum + 1}`,
        parseInt(MAX_ACCOUNTS.tokenAccounts), // tokens
        parseInt(MAX_ACCOUNTS.spotOpenOrders), // serum3
        parseInt(MAX_ACCOUNTS.perpAccounts), // perps
        parseInt(MAX_ACCOUNTS.perpOpenOrders), // perp Oo
      )
      if (tx) {
        if (signToNotifications) {
          createSolanaMessage(walletContext, setCookie)
        }
        const pk = walletContext.wallet.adapter.publicKey

        await waitForSlot(connection, slot)
        const mangoAccounts = await client.getMangoAccountsForOwner(group, pk!)
        const reloadedMangoAccounts = await Promise.all(
          mangoAccounts.map((ma) => ma.reloadSerum3OpenOrders(client)),
        )
        const newAccount = mangoAccounts.find(
          (acc) => acc.accountNum === newAccountNum,
        )
        if (newAccount) {
          set((s) => {
            s.mangoAccount.current = newAccount
            s.mangoAccount.lastSlot = slot
            s.mangoAccounts = reloadedMangoAccounts
          })
        }
        telemetry('accountCreate', {
          props: {
            accountNum: newAccountNum,
            enableNotifications: signToNotifications,
          },
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
    } catch (e) {
      console.error(e)
      setLoading(false)
      if (!isMangoError(e)) return
      notify({
        title: t('new-account-failed'),
        txid: e?.txid,
        type: 'error',
      })
    }
  }

  return loading ? (
    <div className="flex flex-1 flex-col items-center justify-center">
      <BounceLoader loadingMessage={t('creating-account')} />
    </div>
  ) : (
    <div className="flex h-full flex-col justify-between">
      <div className="pb-3">
        <div className="flex items-center">
          {handleBack ? (
            <IconButton className="mr-3" onClick={handleBack} size="small">
              <ArrowLeftIcon className="h-5 w-5" />
            </IconButton>
          ) : null}
          <h2 className="w-full text-center">{t('create-account')}</h2>
          {handleBack ? <div className="h-5 w-5" /> : null}
        </div>
        <p className="mt-1 text-center">{t('insufficient-sol')}</p>
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
          maxLength={30}
        />
        <div className="my-3 flex items-center justify-between rounded-md border border-th-bkg-3 px-3 py-2">
          <div>
            <p className="text-th-fgd-2">{t('enable-notifications')}</p>
            <p className="text-xs">{t('asked-sign-transaction')}</p>
          </div>
          <Switch
            className="text-th-fgd-3"
            checked={signToNotifications}
            onChange={(checked) => setSignToNotifications(checked)}
          />
        </div>
        {maxSolDeposit <= 0 ? (
          <InlineNotification type="error" desc={t('deposit-more-sol')} />
        ) : null}
      </div>
      <Button
        className="mt-6 w-full"
        disabled={maxSolDeposit <= 0}
        onClick={handleNewAccount}
        size="large"
      >
        {t('create-account')}
      </Button>
    </div>
  )
}

export default CreateAccountForm
