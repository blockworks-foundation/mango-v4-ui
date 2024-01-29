import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'next-i18next'
import mangoStore from '@store/mangoStore'
import { createLedgerMessage, notify } from '../../utils/notifications'
import Button, { IconButton, LinkButton } from '../shared/Button'
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
import CreateAccountAdvancedOptions, {
  ACCOUNT_SLOTS,
  DEFAULT_SLOTS,
} from './CreateAccountAdvancedOptions'
import { EnterBottomExitBottom } from '@components/shared/Transitions'

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
  const [showAdvancedOptionsAccountForm, setShowAdvancedOptionsAccountForm] =
    useState(false)
  const [slots, setSlots] = useState<ACCOUNT_SLOTS>(DEFAULT_SLOTS)
  //whole context needed to sign msgs
  const walletContext = useWallet()
  const { maxSolDeposit } = useSolBalance()
  const telemetry = usePlausible<TelemetryEvents>()
  const setCookie = NotificationCookieStore((s) => s.setCookie)

  const hasSetCustomOptions = useMemo(() => {
    return !!Object.entries(slots).find(
      (slot) => slot[1] !== DEFAULT_SLOTS[slot[0] as keyof ACCOUNT_SLOTS],
    )
  }, [slots])

  const handleNewAccount = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const existingMangoAccts = mangoStore.getState().mangoAccounts
    const set = mangoStore.getState().set
    const connection = mangoStore.getState().connection

    if (!group || !walletContext.wallet) return
    setLoading(true)
    const perpOpenOrdersSlots = slots.perpSlots
      ? parseInt(MAX_ACCOUNTS.perpOpenOrders)
      : 0
    try {
      const newAccountNum = getNextAccountNumber(existingMangoAccts)
      const { signature: tx, slot } = await client.createMangoAccount(
        group,
        newAccountNum,
        name || `Account ${newAccountNum + 1}`,
        slots.tokenSlots, // tokens
        slots.serumSlots, // serum3
        slots.perpSlots, // perps
        perpOpenOrdersSlots, // perp Oo
      )
      if (tx) {
        if (signToNotifications) {
          createLedgerMessage(walletContext, setCookie, connection)
        }
        const pk = walletContext.wallet.adapter.publicKey

        await waitForSlot(connection, slot!)
        const mangoAccounts = await client.getMangoAccountsForOwner(group, pk!)
        const reloadedMangoAccounts = await Promise.all(
          mangoAccounts.map((ma) => ma.reloadSerum3OpenOrders(client)),
        )
        const newAccount = mangoAccounts.find(
          (acc) => acc.accountNum === newAccountNum,
        )
        const filteredMangoAccounts = reloadedMangoAccounts?.length
          ? reloadedMangoAccounts
          : []
        if (newAccount) {
          set((s) => {
            s.mangoAccount.current = newAccount
            s.mangoAccount.lastSlot = slot!
            s.mangoAccounts = filteredMangoAccounts
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
  }, [
    customClose,
    name,
    setCookie,
    signToNotifications,
    slots,
    t,
    telemetry,
    walletContext,
  ])

  return loading ? (
    <div className="flex h-full flex-1 flex-col items-center justify-center">
      <BounceLoader loadingMessage={t('creating-account')} />
    </div>
  ) : (
    <div className="relative flex h-full min-h-[462px] flex-col justify-between overflow-hidden">
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
        <LinkButton
          className="mx-auto mt-4"
          onClick={() => setShowAdvancedOptionsAccountForm(true)}
        >
          {t('account:advanced-options')}
        </LinkButton>
        {hasSetCustomOptions ? (
          <p className="mt-1 text-center text-th-success">
            {t('account:custom-account-options-saved')}
          </p>
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

      <EnterBottomExitBottom
        className="absolute bottom-0 left-0 z-20 h-full w-full bg-th-bkg-1"
        show={showAdvancedOptionsAccountForm}
      >
        <CreateAccountAdvancedOptions
          slots={slots}
          setSlots={setSlots}
          onClose={() => setShowAdvancedOptionsAccountForm(false)}
        />
      </EnterBottomExitBottom>
    </div>
  )
}

export default CreateAccountForm
