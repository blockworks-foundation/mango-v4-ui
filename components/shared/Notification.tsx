import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import { Notification, notify } from '../../utils/notifications'
import Loading from './Loading'
import { Transition } from '@headlessui/react'
import {
  CLIENT_TX_TIMEOUT,
  NOTIFICATION_POSITION_KEY,
  PREFERRED_EXPLORER_KEY,
} from '../../utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { EXPLORERS } from 'pages/settings'
import { useTranslation } from 'next-i18next'
import useSolBalance from 'hooks/useSolBalance'

const setMangoStore = mangoStore.getState().set

const NotificationList = () => {
  const { t } = useTranslation()
  const notifications = mangoStore((s) => s.notifications)
  const walletTokens = mangoStore((s) => s.wallet.tokens)
  const notEnoughSoLMessage = t('deposit-more-sol')
  const [notificationPosition] = useLocalStorageState(
    NOTIFICATION_POSITION_KEY,
    'bottom-left'
  )
  const [mounted, setMounted] = useState(false)
  const { maxSolDeposit } = useSolBalance()

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

      if (
        !notEnoughSolNotification &&
        customErrorNotification &&
        maxSolDeposit <= 0
      ) {
        notify({
          title: notEnoughSoLMessage,
          type: 'info',
        })
      }
    }
  }, [notifications, walletTokens, maxSolDeposit])

  const clearAll = useCallback(() => {
    setMangoStore((s) => {
      const newNotifications = s.notifications.map((n) => ({
        ...n,
        show: false,
      }))
      s.notifications = newNotifications
    })
  }, [notifications])

  const reversedNotifications = [...notifications].reverse()

  const position: string = useMemo(() => {
    switch (notificationPosition) {
      case 'bottom-left':
        return 'bottom-0 left-0'
      case 'bottom-right':
        return 'bottom-0 right-0'
      case 'top-left':
        return 'top-0 left-0'
      case 'top-right':
        return 'top-0 right-0'
      default:
        return 'bottom-0 left-0'
    }
  }, [notificationPosition])

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div
      className={`pointer-events-none fixed z-50 flex w-full flex-col items-end space-y-2 p-4 text-th-fgd-1 md:w-auto md:p-6 ${position}`}
    >
      {notifications.filter((n) => n.show).length > 1 ? (
        <button
          className="default-transition pointer-events-auto flex items-center rounded bg-th-bkg-3 px-2 py-1 text-xs text-th-fgd-3 md:hover:bg-th-bkg-4"
          onClick={clearAll}
        >
          <XMarkIcon className="mr-1 h-3.5 w-3.5" />
          {t('clear-all')}
        </button>
      ) : null}
      {reversedNotifications.map((n) => (
        <Notification key={n.id} notification={n} />
      ))}
    </div>
  )
}

const Notification = ({ notification }: { notification: Notification }) => {
  const [notificationPosition] = useLocalStorageState(
    NOTIFICATION_POSITION_KEY,
    'bottom-left'
  )
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )
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
      parsedTitle || type === 'confirm'
        ? CLIENT_TX_TIMEOUT
        : type === 'error'
        ? 30000
        : 8000
    )

    return () => {
      clearInterval(id)
    }
  })

  const {
    enterFromClass,
    enterToClass,
    leaveFromClass,
    leaveToClass,
  }: {
    enterFromClass: string
    enterToClass: string
    leaveFromClass: string
    leaveToClass: string
  } = useMemo(() => {
    const fromLeft = {
      enterFromClass: 'md:-translate-x-48',
      enterToClass: 'md:translate-x-100',
      leaveFromClass: 'md:translate-x-0',
      leaveToClass: 'md:-translate-x-48',
    }
    const fromRight = {
      enterFromClass: 'md:translate-x-48',
      enterToClass: 'md:-translate-x-100',
      leaveFromClass: 'md:translate-x-0',
      leaveToClass: 'md:translate-x-48',
    }
    switch (notificationPosition) {
      case 'bottom-left':
        return fromLeft
      case 'bottom-right':
        return fromRight
      case 'top-left':
        return fromLeft
      case 'top-right':
        return fromRight
      default:
        return fromLeft
    }
  }, [notificationPosition])

  return (
    <Transition
      show={show}
      as={Fragment}
      appear={true}
      enter="ease-out duration-500 transition"
      enterFrom={`-translate-y-2 opacity-0 md:translate-y-0 ${enterFromClass}`}
      enterTo={`translate-y-0 opacity-100 ${enterToClass}`}
      leave="ease-in duration-200 transition"
      leaveFrom={`translate-y-0 ${leaveFromClass}`}
      leaveTo={`-translate-y-2 md:translate-y-0 ${leaveToClass}`}
    >
      <div
        className={`pointer-events-auto w-full rounded-md border bg-th-bkg-2 shadow-lg md:w-auto ${
          type === 'success'
            ? 'border-th-green'
            : type === 'error'
            ? 'border-th-red'
            : 'border-th-bkg-4'
        }`}
      >
        <div className={`relative flex w-full items-center p-3.5 md:w-96`}>
          <div className={`mr-1 flex-shrink-0`}>
            {type === 'success' ? (
              <CheckCircleIcon className={`h-6 w-6 text-th-green`} />
            ) : null}
            {type === 'info' && (
              <InformationCircleIcon className={`h-6 w-6 text-th-fgd-3`} />
            )}
            {type === 'error' && (
              <XCircleIcon className={`h-6 w-6 text-th-red`} />
            )}
            {type === 'confirm' && (
              <Loading className="mr-0.5 h-5 w-5 text-th-primary" />
            )}
          </div>
          <div className={`ml-2 flex-1`}>
            <p className={`text-th-fgd-1`}>{parsedTitle || title}</p>
            {description ? (
              <p
                className={`mb-0 mt-0.5 break-all text-sm leading-tight text-th-fgd-4`}
              >
                {description}
              </p>
            ) : null}
            {txid ? (
              <a
                href={preferredExplorer.url + txid + '?cluster=' + CLUSTER}
                className="default-transition mt-1 flex items-center text-xs text-th-fgd-3 hover:text-th-fgd-2"
                target="_blank"
                rel="noreferrer"
              >
                <div className="break-all">
                  {type === 'error'
                    ? txid
                    : `${txid.slice(0, 14)}...${txid.slice(txid.length - 14)}`}
                </div>
                <ArrowTopRightOnSquareIcon className="mb-0.5 ml-1 h-4 w-4" />
              </a>
            ) : null}
          </div>
          <div className={`absolute right-2 top-2 flex-shrink-0`}>
            <button
              onClick={hideNotification}
              className={`default-transition text-th-fgd-4 focus:outline-none md:hover:text-th-fgd-3`}
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
