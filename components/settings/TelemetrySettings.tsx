import Switch from '@components/forms/Switch'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { SEND_TELEMETRY_KEY } from 'utils/constants'
import Tooltip from '@components/shared/Tooltip'
import { SETTINGS_BUTTON_TITLE_CLASSES } from './AccountSettings'

const TelemetrySettings = () => {
  const { t } = useTranslation('settings')

  const [storedSendTelemetry, setStoredSendTelemetry] = useLocalStorageState(
    SEND_TELEMETRY_KEY,
    true,
  )

  return (
    <div className="border-b border-th-bkg-3 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-normal text-th-fgd-1">
          {t('settings:telemetry')}
        </h3>
      </div>
      <div className="flex items-center justify-between border-t border-th-bkg-3 p-4">
        <Tooltip
          content={t('settings:tooltip-send-telemetry')}
          maxWidth="25rem"
          placement="top-start"
          delay={100}
        >
          <p className={`tooltip-underline ${SETTINGS_BUTTON_TITLE_CLASSES}`}>
            {t('settings:send-telemetry')}
          </p>
        </Tooltip>
        <Switch
          checked={storedSendTelemetry}
          onChange={() => setStoredSendTelemetry(!storedSendTelemetry)}
        />
      </div>
    </div>
  )
}

export default TelemetrySettings
