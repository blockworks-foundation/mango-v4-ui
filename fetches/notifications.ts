import { NOTIFICATION_API } from 'utils/constants'

type Notification = {
  content: string
  createdAt: string
  seen: boolean
  title: string
  _id: string
}

export const fetchNotifications = async (wallet: string, token: string) => {
  const data = await fetch(`${NOTIFICATION_API}notifications`, {
    headers: {
      authorization: token,
      publickey: wallet,
    },
  })
  return data.json() as Promise<Notification[]>
}
