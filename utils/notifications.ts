import mangoStore from '../store/mangoStore'

export type Notification = {
  type: 'success' | 'info' | 'error' | 'confirm'
  title: string
  description?: null | string
  txid?: string
  show: boolean
  id: number
}

export function notify(newNotification: {
  type?: 'success' | 'info' | 'error' | 'confirm'
  title: string
  description?: string
  txid?: string
}) {
  const setMangoStore = mangoStore.getState().set
  const notifications = mangoStore.getState().notifications
  const lastId = mangoStore.getState().notificationIdCounter
  const newId = lastId + 1

  const newNotif: Notification = {
    id: newId,
    type: 'success',
    show: true,
    description: null,
    ...newNotification,
  }

  setMangoStore((state) => {
    state.notificationIdCounter = newId
    state.notifications = [...notifications, newNotif]
  })
}
