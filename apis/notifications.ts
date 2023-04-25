import { NOTIFICATION_API } from 'utils/constants'

export type Notification = {
  content: string
  createdAt: string
  seen: boolean
  title: string
  id: number
}

export const fetchNotifications = async (wallet: string, token: string) => {
  const data = await fetch(`${NOTIFICATION_API}notifications`, {
    headers: {
      authorization: token,
      publickey: wallet,
    },
  })
  const body = await data.json()
  if (body.error) {
    throw { error: body.error, status: data.status }
  }
  return body as Notification[]
}
