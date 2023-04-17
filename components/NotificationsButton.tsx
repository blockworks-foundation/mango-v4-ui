import { useWallet } from '@solana/wallet-adapter-react'
import NotificationCookieStore from '@store/notificationCookieStore'
import { useIsAuthorized } from 'hooks/notifications/useIsAuthorized'
import { Payload, SIWS } from '@web3auth/sign-in-with-solana'
import { NOTIFICATION_API } from 'utils/constants'
import Button from './shared/Button'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { useCookies } from 'hooks/notifications/useCookies'
import { useNotifications } from 'hooks/notifications/useNotifications'
import { useState } from 'react'
import NotificationsModal from './modals/NotificationsModal'
import { useToaster } from 'hooks/notifications/useToaster'

const NotificationsButton = () => {
  useCookies()
  useToaster()
  const wallet = useWallet()
  const setCookie = NotificationCookieStore((s) => s.setCookie)
  const isAuth = useIsAuthorized()
  const { data } = useNotifications()
  const notificationCount = data?.filter((x) => !x.seen).length || 0
  const [showModal, setShowModal] = useState(false)

  const toggleModal = () => {
    setShowModal(!showModal)
  }

  function createSolanaMessage() {
    const payload = new Payload()
    payload.domain = window.location.host
    payload.address = wallet.publicKey!.toString()
    payload.uri = window.location.origin
    payload.statement = 'Login to Mango Notifications Admin App'
    payload.version = '1'
    payload.chainId = 1

    const message = new SIWS({ payload })

    const messageText = message.prepareMessage()
    const messageEncoded = new TextEncoder().encode(messageText)

    wallet.signMessage!(messageEncoded).then(async (resp) => {
      const tokenResp = await fetch(`${NOTIFICATION_API}auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          signatureString: bs58.encode(resp),
        }),
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = (await tokenResp.json()).token
      setCookie(payload.address, token)
    })
  }

  return !isAuth ? (
    <div className="pr-4">
      <Button onClick={createSolanaMessage}>
        Sign in to receive notifications
      </Button>
    </div>
  ) : (
    <div
      className="hidden h-16 border-l border-th-bkg-3 p-3 md:block"
      onClick={() => toggleModal()}
    >
      <button
        type="button"
        className="relative inline-flex items-center rounded-lg bg-blue-700 p-3 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        <svg
          className="h-4 w-4"
          aria-hidden="true"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
        </svg>
        <span className="sr-only">Notifications</span>
        {notificationCount !== 0 && (
          <div className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs font-bold text-white dark:border-gray-900">
            {notificationCount}
          </div>
        )}
      </button>
      {
        <NotificationsModal
          isOpen={showModal}
          onClose={toggleModal}
        ></NotificationsModal>
      }
    </div>
  )
}

export default NotificationsButton
