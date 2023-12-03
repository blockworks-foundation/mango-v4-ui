import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '@store/mangoStore'
import { notify } from '../../utils/notifications'
import Button, { LinkButton } from '../shared/Button'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useState } from 'react'
import Input from '../forms/Input'
import Label from '../forms/Label'
import { PublicKey } from '@solana/web3.js'
import useMangoAccount from 'hooks/useMangoAccount'
import { abbreviateAddress } from 'utils/formatting'
import InlineNotification from '@components/shared/InlineNotification'
import { isMangoError } from 'types'
import Tooltip from '@components/shared/Tooltip'

export const DEFAULT_DELEGATE = '11111111111111111111111111111111'

const DelegateModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('common')
  const { mangoAccount } = useMangoAccount()

  const [delegateAddress, setDelegateAddress] = useState(
    mangoAccount?.delegate?.toString() !== DEFAULT_DELEGATE
      ? mangoAccount!.delegate.toString()
      : '',
  )

  const handleDelegateAccount = async (address: string) => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    if (!mangoAccount || !group) return

    if (address && address !== '' && !PublicKey.isOnCurve(address)) {
      notify({
        type: 'error',
        title: 'Invalid delegate address',
        description: 'Check the public key of your delegate wallet is correct',
      })
    }

    try {
      const { signature: tx, slot } = await client.editMangoAccount(
        group,
        mangoAccount,
        undefined,
        delegateAddress ? new PublicKey(address) : undefined,
      )
      onClose()
      notify({
        title:
          address !== DEFAULT_DELEGATE
            ? t('delegate-account-info', {
                delegate: abbreviateAddress(new PublicKey(address)),
              })
            : 'Account delegation removed',
        type: 'success',
        txid: tx,
      })
      await actions.reloadMangoAccount(slot)
    } catch (e) {
      console.error(e)
      if (!isMangoError(e)) return
      notify({
        title: t('account-update-failed'),
        txid: e?.txid,
        type: 'error',
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-80">
        <div className="flex h-full flex-col justify-between">
          <div className="pb-4">
            <h2 className="mb-1">{t('delegate-account')}</h2>
            <p className="mb-4">
              {t('delegate-account-desc')}{' '}
              <div className="inline-block">
                <Tooltip content={t('delegate-account-tooltip')}>
                  <span className="tooltip-underline">{t('more-info')}</span>
                </Tooltip>
              </div>
            </p>
            {mangoAccount &&
            mangoAccount.delegate.toString() !== DEFAULT_DELEGATE ? (
              <div className="mb-4">
                <InlineNotification
                  type="info"
                  desc={`Account is delegated to ${abbreviateAddress(
                    mangoAccount.delegate,
                  )}`}
                />
              </div>
            ) : null}
            <Label text={t('wallet-address')} />
            <Input
              type="text"
              name="address"
              id="address"
              value={delegateAddress}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDelegateAddress(e.target.value)
              }
            />
          </div>
          <div className="flex flex-col items-center">
            <Button
              className="w-full"
              onClick={() => handleDelegateAccount(delegateAddress)}
              size="large"
            >
              {mangoAccount?.delegate.toString() !== DEFAULT_DELEGATE
                ? t('update-delegate')
                : t('delegate')}
            </Button>
            {mangoAccount?.delegate.toString() !== DEFAULT_DELEGATE ? (
              <LinkButton
                className="mt-4"
                onClick={() => handleDelegateAccount(DEFAULT_DELEGATE)}
              >
                {t('remove-delegate')}
              </LinkButton>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default DelegateModal
