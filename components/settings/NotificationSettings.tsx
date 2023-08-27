import Switch from '@components/forms/Switch'
import { createSolanaMessage } from '@components/notifications/NotificationsDrawer'
import Button from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import { BellIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { useHeaders } from 'hooks/notifications/useHeaders'
import { useIsAuthorized } from 'hooks/notifications/useIsAuthorized'
import { useNotificationSettings } from 'hooks/notifications/useNotificationSettings'
import { useTranslation } from 'next-i18next'
import { NOTIFICATION_API } from 'utils/constants'
import NotificationCookieStore from '@store/notificationCookieStore'
import mangoStore from '@store/mangoStore'
import { useState } from 'react'

const NotificationSettings = () => {
  const { t } = useTranslation(['common', 'notifications', 'settings'])
  const { data, refetch } = useNotificationSettings()
  const { connected } = useWallet()
  const wallet = useWallet()
  const setCookie = NotificationCookieStore((s) => s.setCookie)
  const headers = useHeaders()
  const isAuth = useIsAuthorized()
  const connection = mangoStore((s) => s.connection)
  const [useLedger, setUseLedger] = useState(false)

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
        <div className="flex items-center justify-between border-y border-th-bkg-3 p-4">
          <p>{t('settings:limit-order-filled')}</p>
          <Switch
            checked={!!data?.fillsNotifications}
            onChange={() =>
              handleSettingChange(
                'fillsNotifications',
                !data?.fillsNotifications,
              )
            }
          />
        </div>
      ) : (
        <div className="rounded-lg border border-th-bkg-3 p-6">
          {connected ? (
            <div className="flex flex-col items-center">
              <BellIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
              <p className="mb-4">{t('notifications:unauth-desc')}</p>
              <p>{t('notifications:im-using-ledger')}</p>
              <Switch
                checked={useLedger}
                onChange={(checked) => setUseLedger(checked)}
              />
              <Button
                className="mt-3"
                onClick={() =>
                  createSolanaMessage(wallet, setCookie, connection, useLedger)
                }
              >
                <div className="flex items-center">
                  {useLedger
                    ? t('notifications:sign-with-tx')
                    : t('notifications:sign-message')}
                </div>
              </Button>
            </div>
          ) : (
            <ConnectEmptyState text={t('settings:connect-notifications')} />
          )}
        </div>
      )}
    </>
  )
}

export default NotificationSettings
