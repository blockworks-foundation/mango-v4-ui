import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NumberFormat, {
  NumberFormatValues,
  SourceInfo,
} from 'react-number-format'
import { isMangoError } from 'types'
import { notify } from 'utils/notifications'
import Tooltip from '../shared/Tooltip'
import Button, { LinkButton } from '../shared/Button'
import Loading from '../shared/Loading'
import InlineNotification from '../shared/InlineNotification'
import Modal from '@components/shared/Modal'
import { ModalProps } from 'types/modal'
import Label from '@components/forms/Label'
import useMangoAccountAccounts, {
  getAvaialableAccountsColor,
} from 'hooks/useMangoAccountAccounts'
import { MAX_ACCOUNTS } from 'utils/constants'

const MIN_ACCOUNTS = 8

const INPUT_CLASSES =
  'h-10 rounded-md rounded-r-none border w-full border-th-input-border bg-th-input-bkg px-3 font-mono text-base text-th-fgd-1 focus:border-th-fgd-4 focus:outline-none md:hover:border-th-input-border-hover disabled:text-th-fgd-4 disabled:bg-th-bkg-2 disabled:hover:border-th-input-border'

type FormErrors = Partial<Record<keyof AccountSizeForm, string>>

type AccountSizeForm = {
  tokenAccounts: string | undefined
  spotOpenOrders: string | undefined
  perpAccounts: string | undefined
  perpOpenOrders: string | undefined
  [key: string]: string | undefined
}

const DEFAULT_FORM = {
  tokenAccounts: '',
  spotOpenOrders: '',
  perpAccounts: '',
  perpOpenOrders: '',
}

const MangoAccountSizeModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation(['common', 'settings'])
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const [accountSizeForm, setAccountSizeForm] =
    useState<AccountSizeForm>(DEFAULT_FORM)
  const [formErrors, setFormErrors] = useState<FormErrors>()
  const [submitting, setSubmitting] = useState(false)
  const {
    usedTokens,
    usedSerum3,
    usedPerps,
    usedPerpOo,
    totalTokens,
    totalSerum3,
    totalPerps,
    totalPerpOpenOrders,
  } = useMangoAccountAccounts()

  useEffect(() => {
    if (mangoAccount) {
      setAccountSizeForm({
        tokenAccounts: mangoAccount.tokens.length.toString(),
        spotOpenOrders: mangoAccount.serum3.length.toString(),
        perpAccounts: mangoAccount.perps.length.toString(),
        perpOpenOrders: mangoAccount.perpOpenOrders.length.toString(),
      })
    }
  }, [mangoAccountAddress])

  const isFormValid = (form: AccountSizeForm) => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const invalidFields: FormErrors = {}
    setFormErrors({})
    const { tokenAccounts, spotOpenOrders, perpAccounts, perpOpenOrders } = form

    if (tokenAccounts) {
      const minTokenAccountsLength = mangoAccount?.tokens.length || MIN_ACCOUNTS
      if (parseInt(tokenAccounts) < minTokenAccountsLength) {
        invalidFields.tokenAccounts = t('settings:error-amount', {
          type: t('settings:token-accounts'),
          greaterThan: mangoAccount?.tokens.length,
          lessThan: '17',
        })
      }
    }
    if (spotOpenOrders) {
      const minSpotOpenOrdersLength =
        mangoAccount?.serum3.length || MIN_ACCOUNTS
      if (parseInt(spotOpenOrders) < minSpotOpenOrdersLength) {
        invalidFields.spotOpenOrders = t('settings:error-amount', {
          type: t('settings:spot-markets'),
          greaterThan: mangoAccount?.serum3.length,
          lessThan: '17',
        })
      }
    }
    if (perpAccounts) {
      const minPerpAccountsLength = mangoAccount?.perps.length || MIN_ACCOUNTS
      if (parseInt(perpAccounts) < minPerpAccountsLength) {
        invalidFields.perpAccounts = t('settings:error-amount', {
          type: t('settings:perp-accounts'),
          greaterThan: mangoAccount?.perps.length,
          lessThan: '17',
        })
      }
    }
    if (perpOpenOrders) {
      const minPerpOpenOrdersLength =
        mangoAccount?.perpOpenOrders.length || MIN_ACCOUNTS
      if (parseInt(perpOpenOrders) < minPerpOpenOrdersLength) {
        invalidFields.perpOpenOrders = t('settings:error-amount', {
          type: t('settings:perp-open-orders'),
          greaterThan: mangoAccount?.perpOpenOrders.length,
          lessThan: '17',
        })
      }
    }
    if (Object.keys(invalidFields).length) {
      setFormErrors(invalidFields)
    }
    return invalidFields
  }

  const handleMax = (propertyName: keyof AccountSizeForm) => {
    setFormErrors({})
    const defaultSizes = MAX_ACCOUNTS as AccountSizeForm
    setAccountSizeForm((prevState) => ({
      ...prevState,
      [propertyName]: defaultSizes[propertyName],
    }))
  }

  // const handleMaxAll = () => {
  //   setFormErrors({})
  //   const newValues = { ...accountSizeForm }
  //   for (const key in newValues) {
  //     newValues[key] = MAX_ACCOUNTS
  //   }
  //   setAccountSizeForm(newValues)
  // }

  const handleSetForm = (
    propertyName: keyof AccountSizeForm,
    e: NumberFormatValues,
    info: SourceInfo,
  ) => {
    if (info.source !== 'event') return
    setFormErrors({})
    setAccountSizeForm((prevState) => ({
      ...prevState,
      [propertyName]: e.value,
    }))
  }

  const handleUpdateAccountSize = useCallback(async () => {
    const invalidFields = isFormValid(accountSizeForm)
    if (Object.keys(invalidFields).length) {
      return
    }
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions
    const { tokenAccounts, spotOpenOrders, perpAccounts, perpOpenOrders } =
      accountSizeForm
    if (
      !mangoAccount ||
      !group ||
      !tokenAccounts ||
      !spotOpenOrders ||
      !perpAccounts ||
      !perpOpenOrders
    )
      return
    setSubmitting(true)
    try {
      const { signature: tx, slot } = await client.accountExpandV2(
        group,
        mangoAccount,
        parseInt(tokenAccounts),
        parseInt(spotOpenOrders),
        parseInt(perpAccounts),
        parseInt(perpOpenOrders),
        mangoAccount.tokenConditionalSwaps.length,
      )
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
      })
      await actions.reloadMangoAccount(slot)
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
  }, [accountSizeForm])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <>
        <h2 className="mb-2 text-center">{t('settings:account-slots')}</h2>
        {/* <LinkButton className="font-normal mb-0.5" onClick={handleMaxAll}>
            {t('settings:max-all')}
          </LinkButton> */}
        <p className="mb-4 text-center text-xs">
          {t('settings:increase-account-slots-desc')}
        </p>
        <div className="mb-4">
          <AccountSizeFormInput
            availableAccounts={
              <span
                className={getAvaialableAccountsColor(
                  usedTokens.length,
                  totalTokens.length,
                )}
              >{`${usedTokens.length}/${totalTokens.length}`}</span>
            }
            disabled={
              mangoAccount
                ? mangoAccount.tokens.length >=
                  Number(MAX_ACCOUNTS.tokenAccounts)
                : false
            }
            error={formErrors?.tokenAccounts}
            label={t('tokens')}
            handleMax={() => handleMax('tokenAccounts')}
            handleSetForm={handleSetForm}
            tooltipContent={t('settings:tooltip-token-accounts', {
              max: MAX_ACCOUNTS.tokenAccounts,
            })}
            type="tokenAccounts"
            value={accountSizeForm.tokenAccounts}
          />
        </div>
        <div className="mb-4">
          <AccountSizeFormInput
            availableAccounts={
              <span
                className={getAvaialableAccountsColor(
                  usedSerum3.length,
                  totalSerum3.length,
                )}
              >{`${usedSerum3.length}/${totalSerum3.length}`}</span>
            }
            disabled
            error={formErrors?.spotOpenOrders}
            label={t('settings:spot-markets')}
            handleMax={() => handleMax('spotOpenOrders')}
            handleSetForm={handleSetForm}
            tooltipContent={t('settings:tooltip-spot-markets', {
              max: MAX_ACCOUNTS.spotOpenOrders,
            })}
            type="spotOpenOrders"
            value={accountSizeForm.spotOpenOrders}
          />
        </div>
        <div className="mb-4">
          <AccountSizeFormInput
            availableAccounts={
              <span
                className={getAvaialableAccountsColor(
                  usedPerps.length,
                  totalPerps.length,
                )}
                key="spotOpenOrders"
              >{`${usedPerps.length}/${totalPerps.length}`}</span>
            }
            disabled
            error={formErrors?.perpAccounts}
            label={t('settings:perp-markets')}
            handleMax={() => handleMax('perpAccounts')}
            handleSetForm={handleSetForm}
            tooltipContent={t('settings:tooltip-perp-markets', {
              max: MAX_ACCOUNTS.perpAccounts,
            })}
            type="perpAccounts"
            value={accountSizeForm.perpAccounts}
          />
        </div>
        <div>
          <AccountSizeFormInput
            availableAccounts={
              <span
                className={getAvaialableAccountsColor(
                  usedPerpOo.length,
                  totalPerpOpenOrders.length,
                )}
                key="spotOpenOrders"
              >{`${usedPerpOo.length}/${totalPerpOpenOrders.length}`}</span>
            }
            disabled={
              mangoAccount
                ? mangoAccount.perpOpenOrders.length >=
                  Number(MAX_ACCOUNTS.perpOpenOrders)
                : false
            }
            error={formErrors?.perpOpenOrders}
            label={t('settings:perp-open-orders')}
            handleMax={() => handleMax('perpOpenOrders')}
            handleSetForm={handleSetForm}
            tooltipContent={t('settings:tooltip-perp-open-orders', {
              max: MAX_ACCOUNTS.perpOpenOrders,
            })}
            type="perpOpenOrders"
            value={accountSizeForm.perpOpenOrders}
          />
        </div>
        <Button
          className="mb-4 mt-6 flex w-full items-center justify-center"
          onClick={handleUpdateAccountSize}
          size="large"
        >
          {submitting ? <Loading /> : t('settings:increase-account-slots')}
        </Button>
        <LinkButton className="mx-auto" onClick={onClose}>
          {t('cancel')}
        </LinkButton>
      </>
    </Modal>
  )
}

export default MangoAccountSizeModal

const AccountSizeFormInput = ({
  availableAccounts,
  disabled,
  error,
  label,
  handleMax,
  handleSetForm,
  tooltipContent,
  type,
  value,
}: {
  availableAccounts: ReactNode
  disabled?: boolean
  error: string | undefined
  label: string
  handleMax: (type: keyof AccountSizeForm) => void
  handleSetForm: (
    type: keyof AccountSizeForm,
    values: NumberFormatValues,
    info: SourceInfo,
  ) => void
  tooltipContent: string
  type: keyof AccountSizeForm
  value: string | undefined
}) => {
  const { t } = useTranslation(['common', 'settings'])
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Tooltip content={tooltipContent}>
            <Label className="tooltip-underline mr-1" text={label} />
          </Tooltip>
        </div>
        {!disabled ? (
          <LinkButton
            className="mb-2 font-normal"
            onClick={() => handleMax('tokenAccounts')}
          >
            {t('max')}
          </LinkButton>
        ) : null}
      </div>
      <div className="flex items-center">
        <NumberFormat
          name={type as string}
          id={type as string}
          inputMode="numeric"
          thousandSeparator=","
          allowNegative={false}
          isNumericString={true}
          className={INPUT_CLASSES}
          value={value}
          onValueChange={(e, sourceInfo) => handleSetForm(type, e, sourceInfo)}
          disabled={disabled}
        />
        <div
          className={`flex h-10 items-center rounded-r-md border border-l-0 border-th-input-border px-2 ${
            disabled ? 'bg-th-bkg-2' : 'bg-th-input-bkg'
          }`}
        >
          <p className="font-mono text-xs">{availableAccounts}</p>
        </div>
      </div>
      {error ? (
        <div className="mt-1">
          <InlineNotification
            type="error"
            desc={error}
            hideBorder
            hidePadding
          />
        </div>
      ) : null}
    </>
  )
}
