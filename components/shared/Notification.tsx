import { Fragment, useEffect } from 'react'
import {
  CheckCircleIcon,
  ExternalLinkIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/outline'
import useMangoStore, { CLIENT_TX_TIMEOUT, CLUSTER } from '../../store/state'
import { Notification, notify } from '../../utils/notifications'
import Loading from './Loading'
import { Transition } from '@headlessui/react'
import { TokenInstructions } from '@project-serum/serum'

const NotificationList = () => {
  const notifications = useMangoStore((s) => s.notifications)
  const walletTokens = useMangoStore((s) => s.wallet.tokens)
  const notEnoughSoLMessage = 'Not enough SOL'

  // if a notification is shown with {"InstructionError":[0,{"Custom":1}]} then
  // add a notification letting the user know they may not have enough SOL
  useEffect(() => {
    if (notifications.length) {
      const customErrorNotification = notifications.find(
        (n) => n.description && n.description.includes('"Custom":1')
      )
      const notEnoughSolNotification = notifications.find(
        (n) => n.title && n.title.includes(notEnoughSoLMessage)
      )
      const solBalance = walletTokens.find((t) =>
        t.mint.equals(TokenInstructions.WRAPPED_SOL_MINT)
      )?.uiAmount

      if (
        !notEnoughSolNotification &&
        customErrorNotification &&
        solBalance &&
        solBalance < 0.04
      ) {
        notify({
          title: notEnoughSoLMessage,
          type: 'info',
        })
      }
    }
  }, [notifications, walletTokens])

  const reversedNotifications = [...notifications].reverse()

  return (
    <div
      className={`text-th-fgd-1 pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:p-6`}
    >
      <div className={`flex w-full flex-col`}>
        {reversedNotifications.map((n) => (
          <Notification key={n.id} notification={n} />
        ))}
      </div>
    </div>
  )
}

const Notification = ({ notification }: { notification: Notification }) => {
  const setMangoStore = useMangoStore((s) => s.set)
  const { type, title, description, txid, show, id } = notification

  // overwrite the title if of the error message if it is a time out error
  let parsedTitle: string | undefined
  if (description) {
    if (
      description?.includes('Timed out awaiting') ||
      description?.includes('was not confirmed')
    ) {
      parsedTitle = 'Transaction status unknown'
    }
  }

  // if the notification is a success, then hide the confirming tx notification with the same txid
  useEffect(() => {
    if ((type === 'error' || type === 'success') && txid) {
      setMangoStore((s) => {
        const newNotifications = s.notifications.map((n) =>
          n.txid === txid && n.type === 'confirm' ? { ...n, show: false } : n
        )
        s.notifications = newNotifications
      })
    }
  }, [type, txid])

  const hideNotification = () => {
    setMangoStore((s) => {
      const newNotifications = s.notifications.map((n) =>
        n.id === id ? { ...n, show: false } : n
      )
      s.notifications = newNotifications
    })
  }

  // auto hide a notification after 8 seconds unless it is a confirming or time out notification
  // if no status is provided for a tx notification after 90s, hide it
  useEffect(() => {
    const id = setTimeout(
      () => {
        if (show) {
          hideNotification()
        }
      },
      parsedTitle || type === 'confirm' || type === 'error'
        ? CLIENT_TX_TIMEOUT
        : 8000
    )

    return () => {
      clearInterval(id)
    }
  })

  return (
    <Transition
      show={show}
      as={Fragment}
      appear={true}
      enter="transform ease-out duration-500 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:-translate-x-48"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transform ease-in duration-200 transition"
      leaveFrom="translate-y-0 sm:translate-x-0"
      leaveTo="-translate-y-2 sm:translate-y-0 sm:-translate-x-48"
    >
      <div
        className={`border-th-bkg-4 bg-th-bkg-3 pointer-events-auto mt-2 w-full max-w-sm overflow-hidden rounded-md border shadow-lg ring-1 ring-black ring-opacity-5`}
      >
        <div className={`relative flex items-center px-2 py-2.5`}>
          <div className={`flex-shrink-0`}>
            {type === 'success' ? (
              <CheckCircleIcon className={`text-th-green mr-1 h-7 w-7`} />
            ) : null}
            {type === 'info' && (
              <InformationCircleIcon
                className={`text-th-primary mr-1 h-7 w-7`}
              />
            )}
            {type === 'error' && (
              <XCircleIcon className={`text-th-red mr-1 h-7 w-7`} />
            )}
            {type === 'confirm' && (
              <Loading className="text-th-fgd-3 mr-1 h-7 w-7" />
            )}
          </div>
          <div className={`ml-2 flex-1`}>
            <div className={`text-normal text-th-fgd-1 font-bold`}>
              {parsedTitle || title}
            </div>
            {description ? (
              <p className={`text-th-fgd-3 mb-0 mt-0.5 leading-tight`}>
                {description}
              </p>
            ) : null}
            {txid ? (
              <a
                href={
                  'https://explorer.solana.com/tx/' +
                  txid +
                  '?cluster=' +
                  CLUSTER
                }
                className="mt-1 flex items-center text-sm"
                target="_blank"
                rel="noreferrer"
              >
                <div className="flex-1 break-all text-xs">
                  {type === 'error'
                    ? txid
                    : `${txid.slice(0, 14)}...${txid.slice(txid.length - 14)}`}
                </div>
                <ExternalLinkIcon className="mb-0.5 ml-1 h-4 w-4" />
              </a>
            ) : null}
          </div>
          <div className={`absolute right-2 top-2 flex-shrink-0`}>
            <button
              onClick={hideNotification}
              className={`text-th-fgd-4 md:hover:text-th-primary focus:outline-none`}
            >
              <span className={`sr-only`}>Close</span>
              <svg
                className={`h-5 w-5`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  )
}

export default NotificationList
