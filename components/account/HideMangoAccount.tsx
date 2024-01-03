import {
  toggleMangoAccountHidden,
  useMangoAccountHidden,
} from 'hooks/useMangoAccountHidden'
import { useWallet } from '@solana/wallet-adapter-react'
import useMangoAccount from 'hooks/useMangoAccount'
import Switch from '@components/forms/Switch'
import { useState } from 'react'
import Loading from '@components/shared/Loading'
import Tooltip from '@components/shared/Tooltip'
import { useTranslation } from 'react-i18next'
import { SETTINGS_BUTTON_TITLE_CLASSES } from '@components/settings/AccountSettings'

const HideMangoAccount = () => {
  const { t } = useTranslation('settings')
  const { publicKey, signMessage } = useWallet()
  const { mangoAccountPk } = useMangoAccount()
  const { accountHidden, refetch } = useMangoAccountHidden()
  const [signingForHide, setSigningForHide] = useState(false)

  const handleHideMangoAccount = async () => {
    if (!publicKey || !mangoAccountPk || !signMessage) return
    setSigningForHide(true)
    try {
      await toggleMangoAccountHidden(
        mangoAccountPk,
        publicKey,
        !(accountHidden ?? false),
        signMessage,
      )
      refetch()
      setSigningForHide(false)
    } catch (e) {
      console.error('Error toggling account visibility', e)
      setSigningForHide(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between border-t border-th-bkg-3 py-4 md:px-4">
        <Tooltip content={t('settings:tooltip-private-account')}>
          <p className={`tooltip-underline ${SETTINGS_BUTTON_TITLE_CLASSES}`}>
            {t('settings:private-account')}
          </p>
        </Tooltip>
        {signingForHide ? (
          <Loading />
        ) : (
          <Switch
            checked={accountHidden ?? false}
            onChange={handleHideMangoAccount}
          />
        )}
      </div>
    </>
  )
}

export default HideMangoAccount
