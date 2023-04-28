import { useNotifications } from 'hooks/notifications/useNotifications'
import { useMemo, useState } from 'react'
import NotificationsDrawer from './NotificationsDrawer'
import { BellIcon } from '@heroicons/react/20/solid'
import { useIsAuthorized } from 'hooks/notifications/useIsAuthorized'
import { useCookies } from 'hooks/notifications/useCookies'
import { useNotificationSocket } from 'hooks/notifications/useNotificationSocket'

const NotificationsButton = () => {
  useCookies()
  useNotificationSocket()

  const { data, isFetching } = useNotifications()
  const isAuth = useIsAuthorized()
  const [showDraw, setShowDraw] = useState(false)

  const notificationCount = useMemo(() => {
    if (!isAuth && !isFetching) {
      return 1
    } else if (!data || !data.length) {
      return 0
    } else return data.filter((x) => !x.seen).length
  }, [data, isAuth, isFetching])

  const toggleModal = () => {
    setShowDraw(!showDraw)
  }

  return (
    <>
      <button
        className="relative flex h-16 w-16 items-center justify-center border-l border-r border-th-bkg-3 focus-visible:bg-th-bkg-3 md:border-r-0 md:hover:bg-th-bkg-2"
        onClick={() => toggleModal()}
      >
        <BellIcon className="h-5 w-5" />
        <span className="sr-only">Notifications</span>
        {notificationCount !== 0 ? (
          <div className="absolute top-4 right-4">
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="absolute inline-flex h-3.5 w-3.5 animate-ping rounded-full bg-th-down opacity-75"></span>
              <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-th-down text-xxs font-bold text-th-fgd-1">
                {notificationCount}
              </span>
            </span>
          </div>
        ) : null}
      </button>
      <NotificationsDrawer isOpen={showDraw} onClose={toggleModal} />
    </>
  )
}

export default NotificationsButton
