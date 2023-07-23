import Switch from '@components/forms/Switch'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { SOUND_SETTINGS_KEY } from 'utils/constants'

export const INITIAL_SOUND_SETTINGS = {
  'recent-trades': false,
  'swap-success': false,
  'transaction-success': false,
  'transaction-fail': false,
}

const SoundSettings = () => {
  const { t } = useTranslation(['common', 'settings'])
  const [soundSettings, setSoundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS,
  )

  const handleToggleSoundSetting = (settingName: string) => {
    if (settingName === 'all') {
      const toggle = !Object.values(soundSettings).includes(false)
      Object.keys(soundSettings).forEach((key) => {
        soundSettings[key] = !toggle
      })
      setSoundSettings(soundSettings)
    } else {
      setSoundSettings({
        ...soundSettings,
        [settingName]: !soundSettings[settingName],
      })
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base">{t('settings:sounds')}</h2>
        <Switch
          checked={!Object.values(soundSettings).includes(false)}
          onChange={() => handleToggleSoundSetting('all')}
        />
      </div>
      {/* <div className="flex items-center justify-between border-t border-th-bkg-3 p-4">
        <p>{t('settings:recent-trades')}</p>
        <Switch
          checked={soundSettings['recent-trades']}
          onChange={() => handleToggleSoundSetting('recent-trades')}
        />
      </div> */}
      <div className="flex items-center justify-between border-t border-th-bkg-3 p-4">
        <p>{t('settings:swap-success')}</p>
        <Switch
          checked={soundSettings['swap-success']}
          onChange={() => handleToggleSoundSetting('swap-success')}
        />
      </div>
      <div className="flex items-center justify-between border-t border-th-bkg-3 p-4">
        <p>{t('settings:transaction-success')}</p>
        <Switch
          checked={soundSettings['transaction-success']}
          onChange={() => handleToggleSoundSetting('transaction-success')}
        />
      </div>
      <div className="flex items-center justify-between border-t border-th-bkg-3 p-4">
        <p>{t('settings:transaction-fail')}</p>
        <Switch
          checked={soundSettings['transaction-fail']}
          onChange={() => handleToggleSoundSetting('transaction-fail')}
        />
      </div>
    </>
  )
}

export default SoundSettings
