import { NOTIFICATION_API } from 'utils/constants'

export type NotificationSettings = {
  fillsNotifications: boolean
}

export const fetchNotificationSettings = async (
  wallet: string,
  token: string,
  mangoAccount: string,
) => {
  const data = await fetch(
    `${NOTIFICATION_API}notifications/user/getSettings`,
    {
      headers: {
        authorization: token,
        publickey: wallet,
        'mango-account': mangoAccount,
      },
    },
  )
  const body = await data.json()

  if (body.error) {
    throw { error: body.error, status: data.status }
  }

  return body as NotificationSettings
}
