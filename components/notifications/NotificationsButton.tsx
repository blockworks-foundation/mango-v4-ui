import { useCookies } from 'hooks/notifications/useCookies'
import { useNotifications } from 'hooks/notifications/useNotifications'
import { useMemo, useState } from 'react'
import NotificationsDraw from './NotificationsDraw'
import { useToaster } from 'hooks/notifications/useToaster'
import { EnvelopeIcon } from '@heroicons/react/20/solid'

const NotificationsButton = () => {
  useCookies()
  useToaster()
  const { data } = useNotifications()
  const [showModal, setShowModal] = useState(false)

  const notificationCount = useMemo(() => {
    if (!data || !data.length) return 0
    return data.filter((x) => !x.seen).length
  }, [data])

  const toggleModal = () => {
    setShowModal(!showModal)
  }

  return (
    <>
      <button
        className="relative flex h-16 w-16 items-center justify-center border-l border-r border-th-bkg-3 focus:bg-th-bkg-2 focus:outline-none md:border-r-0 md:hover:bg-th-bkg-2"
        onClick={() => toggleModal()}
      >
        <EnvelopeIcon className="h-5 w-5" />
        <span className="sr-only">Notifications</span>
        {notificationCount !== 0 ? (
          <div className="absolute top-3 right-3 inline-flex h-4 w-4 items-center justify-center rounded-full bg-th-down text-xxs font-bold text-th-fgd-1">
            {notificationCount}
          </div>
        ) : null}
      </button>
      <NotificationsDraw isOpen={showModal} onClose={toggleModal} />
    </>
  )
}

export default NotificationsButton
