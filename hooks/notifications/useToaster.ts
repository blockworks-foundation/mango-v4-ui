import usePrevious from '@components/shared/usePrevious'
import { useNotifications } from './useNotifications'
import { useEffect } from 'react'
import { Notification } from '../../apis/notifications'
import { notify } from 'utils/notifications'

export function useToaster() {
  const { data } = useNotifications()
  const previousData = usePrevious(data)

  useEffect(() => {
    if (data && data.length && previousData) {
      const oldIds = previousData.map((item: Notification) => item.id)
      const newObjects = data.filter(
        (item: Notification) => !oldIds.includes(item.id)
      )
      if (newObjects.length) {
        newObjects.map((x) =>
          notify({
            title: 'New message',
            description: x.title,
            type: 'info',
          })
        )
      }
    }
  }, [data, previousData])
}
