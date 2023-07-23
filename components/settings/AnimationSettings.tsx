import Switch from '@components/forms/Switch'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'

export const INITIAL_ANIMATION_SETTINGS = {
  'number-scroll': false,
  'orderbook-flash': false,
  'swap-success': false,
}

const AnimationSettings = () => {
  const { t } = useTranslation(['common', 'settings'])
  const [animationSettings, setAnimationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS,
  )

  const handleToggleAnimationSetting = (settingName: string) => {
    if (settingName === 'all') {
      const toggle = !Object.values(animationSettings).includes(false)
      Object.keys(animationSettings).forEach((key) => {
        animationSettings[key] = !toggle
      })
      setAnimationSettings(animationSettings)
    } else {
      setAnimationSettings({
        ...animationSettings,
        [settingName]: !animationSettings[settingName],
      })
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base">{t('settings:animations')}</h2>
        <Switch
          checked={!Object.values(animationSettings).includes(false)}
          onChange={() => handleToggleAnimationSetting('all')}
        />
      </div>
      <div className="flex items-center justify-between border-t border-th-bkg-3 p-4">
        <p>{t('settings:number-scroll')}</p>
        <Switch
          checked={animationSettings['number-scroll']}
          onChange={() => handleToggleAnimationSetting('number-scroll')}
        />
      </div>
      <div className="flex items-center justify-between border-t border-th-bkg-3 p-4">
        <p>{t('settings:orderbook-flash')}</p>
        <Switch
          checked={animationSettings['orderbook-flash']}
          onChange={() => handleToggleAnimationSetting('orderbook-flash')}
        />
      </div>
      <div className="flex items-center justify-between border-t border-th-bkg-3 p-4">
        <p>{t('settings:swap-success')}</p>
        <Switch
          checked={animationSettings['swap-success']}
          onChange={() => handleToggleAnimationSetting('swap-success')}
        />
      </div>
    </>
  )
}

export default AnimationSettings
