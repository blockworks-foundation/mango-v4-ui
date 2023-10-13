import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { AUTO_CONNECT_WALLET } from 'utils/constants'
import Switch from '@components/forms/Switch'

const AutoConnectSettings = () => {
  const { t } = useTranslation(['common', 'settings'])
  const [autoConnect, setAutoConnect] = useLocalStorageState(
    AUTO_CONNECT_WALLET,
    true,
  )

  return (
    <>
      <h3 className="mb-4 text-sm text-th-fgd-1">{t('wallet')}</h3>
      <div className="border-b border-th-bkg-3">
        <div className="flex items-center justify-between border-t border-th-bkg-3 p-4">
          <p>{t('settings:auto-connect-wallet')}</p>
          <Switch
            checked={autoConnect}
            onChange={() => setAutoConnect(!autoConnect)}
          />
        </div>
      </div>
    </>
  )
}

export default AutoConnectSettings
