import Switch from '@components/forms/Switch'
import { useHeaders } from 'hooks/notifications/useHeaders'
import { useIsAuthorized } from 'hooks/notifications/useIsAuthorized'
import { useNotificationSettings } from 'hooks/notifications/useNotificationSettings'
import { useTranslation } from 'next-i18next'
import { NOTIFICATION_API } from 'utils/constants'

export const INITIAL_SOUND_SETTINGS = {
  'recent-trades': false,
  'swap-success': false,
  'transaction-success': false,
  'transaction-fail': false,
}

const NotificationSettings = () => {
  const { t } = useTranslation(['common', 'settings'])
  const { data, refetch } = useNotificationSettings()
  const headers = useHeaders()
  const isAuth = useIsAuthorized()

  const handleSettingChange = async (key: string, val: boolean) => {
    if (data) {
      const newSettings = {
        ...data,
        [key]: val,
      }
      await fetch(`${NOTIFICATION_API}notifications/user/editSettings`, {
        method: 'POST',
        headers: headers.headers,
        body: JSON.stringify({
          ...newSettings,
        }),
      })
      refetch()
    }
  }
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base">{t('settings:notifications')}</h2>
      </div>
      {isAuth ? (
        <div className="flex items-center justify-between border-t border-th-bkg-3 p-4">
          <p>{t('settings:limit-order-filled')}</p>
          <Switch
            checked={!!data?.fillsNotifications}
            onChange={() =>
              handleSettingChange(
                'fillsNotifications',
                !data?.fillsNotifications
              )
            }
          />
        </div>
      ) : (
        <div className="relative top-1/2 flex -translate-y-1/2 flex-col justify-center px-6 pb-20">
          <div className="flex flex-col items-center justify-center text-center">
            <h3 className="mb-1 text-base">
              {t('settings:sign-to-notifications')}
            </h3>
          </div>
        </div>
      )}
    </>
  )
}

export default NotificationSettings
