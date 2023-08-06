import Button from '@components/shared/Button'
import InlineNotification from '@components/shared/InlineNotification'
import Loading from '@components/shared/Loading'
import Tooltip from '@components/shared/Tooltip'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import { useTranslation } from 'next-i18next'
import { useCallback, useEffect, useState } from 'react'
import NumberFormat, {
  NumberFormatValues,
  SourceInfo,
} from 'react-number-format'
import { isMangoError } from 'types'
import { notify } from 'utils/notifications'

type FormErrors = Partial<Record<keyof AccountSettingsForm, string>>

type AccountSettingsForm = {
  tokenAccounts: string | undefined
}

const DEFAULT_FORM = {
  tokenAccounts: '',
}

const AccountSettings = () => {
  const { t } = useTranslation(['common', 'settings'])
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const [accountSettingsForm, setAccountSettingsForm] =
    useState<AccountSettingsForm>(DEFAULT_FORM)
  const [formErrors, setFormErrors] = useState<FormErrors>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (mangoAccountAddress) {
      setAccountSettingsForm({
        tokenAccounts: mangoAccount?.tokens.length.toString(),
      })
    }
  }, [mangoAccountAddress])

  const isFormValid = (form: AccountSettingsForm) => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const invalidFields: FormErrors = {}
    setFormErrors({})
    const tokenAccounts: (keyof AccountSettingsForm)[] = ['tokenAccounts']
    for (const key of tokenAccounts) {
      const value = form[key] as string
      const minLength = mangoAccount?.tokens.length || 8
      if (parseInt(value) <= minLength) {
        invalidFields[key] = t('settings:error-amount', {
          type: t('settings:token-accounts'),
          greaterThan: mangoAccount?.tokens.length,
          lessThan: '17',
        })
      }
    }
    if (Object.keys(invalidFields).length) {
      setFormErrors(invalidFields)
    }
    return invalidFields
  }

  const handleSetForm = (
    propertyName: string,
    e: NumberFormatValues,
    info: SourceInfo,
  ) => {
    if (info.source !== 'event') return
    setFormErrors({})
    setAccountSettingsForm((prevState) => ({
      ...prevState,
      [propertyName]: e.value,
    }))
  }

  const handleUpdateAccountSize = useCallback(async () => {
    const invalidFields = isFormValid(accountSettingsForm)
    if (Object.keys(invalidFields).length) {
      return
    }
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions
    const { tokenAccounts } = accountSettingsForm
    if (!mangoAccount || !group || !tokenAccounts) return
    setSubmitting(true)
    try {
      const tx = await client.accountExpandV2(
        group,
        mangoAccount,
        parseInt(tokenAccounts),
        mangoAccount.serum3.length,
        mangoAccount.perps.length,
        mangoAccount.perpOpenOrders.length,
        mangoAccount.tokenConditionalSwaps.length,
      )
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
      })
      await actions.reloadMangoAccount()
      setSubmitting(false)
    } catch (e) {
      console.error(e)
      if (!isMangoError(e)) return
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }, [accountSettingsForm])

  return (
    <>
      <h2 className="mb-4 text-base">{t('account')}</h2>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <Tooltip content={t('settings:tooltip-increase-token-accounts')}>
          <p className="tooltip-underline mb-2 md:mb-0">
            {t('settings:increase-token-accounts')}
          </p>
        </Tooltip>
        <div className="flex flex-col items-start md:items-end">
          <div className="flex items-center w-full md:w-auto">
            <NumberFormat
              name="tokenAccounts"
              id="tokenAccounts"
              inputMode="numeric"
              thousandSeparator=","
              allowNegative={false}
              isNumericString={true}
              className="h-10 rounded-l-md border w-full md:w-24 border-th-input-border bg-th-input-bkg px-3 font-mono text-base text-th-fgd-1 focus:border-th-fgd-4 focus:outline-none md:hover:border-th-input-border-hover"
              value={accountSettingsForm.tokenAccounts}
              onValueChange={(e, sourceInfo) =>
                handleSetForm('tokenAccounts', e, sourceInfo)
              }
            />
            <Button
              className="border-l-0 rounded-l-none w-24 flex items-center justify-center"
              onClick={handleUpdateAccountSize}
              secondary
            >
              {submitting ? <Loading /> : t('update')}
            </Button>
          </div>
          {formErrors?.tokenAccounts ? (
            <div className="mt-1">
              <InlineNotification
                type="error"
                desc={formErrors.tokenAccounts}
                hideBorder
                hidePadding
              />
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default AccountSettings
