import { useCookies } from 'hooks/notifications/useCookies'
import { useNotifications } from 'hooks/notifications/useNotifications'
import { useEffect, useMemo, useState } from 'react'
import NotificationsDrawer from './NotificationsDrawer'
import { useToaster } from 'hooks/notifications/useToaster'
import { BellIcon } from '@heroicons/react/20/solid'
import { useIsAuthorized } from 'hooks/notifications/useIsAuthorized'
import useMangoAccount from 'hooks/useMangoAccount'
import useUnownedAccount from 'hooks/useUnownedAccount'

const NotificationsButton = () => {
  useCookies()
  useToaster()
  const { data, isFetching } = useNotifications()
  const isAuth = useIsAuthorized()
  const { mangoAccountAddress } = useMangoAccount()
  const { isUnownedAccount } = useUnownedAccount()
  const [showDraw, setShowDraw] = useState(false)

  const notificationCount = useMemo(() => {
    if (!data || !data.length) return 0
    return data.filter((x) => !x.seen).length
  }, [data])

  const toggleModal = () => {
    setShowDraw(!showDraw)
  }

  // open draw when user hasn't signed for notifications
  useEffect(() => {
    if (!isAuth && !isFetching && mangoAccountAddress && !isUnownedAccount) {
      setShowDraw(true)
    }
  }, [isAuth, isFetching, mangoAccountAddress, isUnownedAccount])

  return (
    <>
      <button
        className="relative flex h-16 w-16 items-center justify-center border-l border-r border-th-bkg-3 focus:bg-th-bkg-2 focus:outline-none md:border-r-0 md:hover:bg-th-bkg-2"
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
