import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import { TransactionNotification, notify } from '../../utils/notifications'
import Loading from '@components/shared/Loading'
import { Transition } from '@headlessui/react'
import {
  CLIENT_TX_TIMEOUT,
  NOTIFICATION_POSITION_KEY,
  PREFERRED_EXPLORER_KEY,
} from '../../utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import useSolBalance from 'hooks/useSolBalance'
import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const setMangoStore = mangoStore.getState().set

function parseDescription(description: string | null | undefined) {
  if (
    description?.includes('{"err":{"InstructionError":[2,{"Custom":6001}]}}')
  ) {
    return 'Your max slippage tolerance was exceeded'
  }

  return description
}

const TransactionNotificationList = () => {
  const { t } = useTranslation()
  const transactionNotifications = mangoStore((s) => s.transactionNotifications)
  const walletTokens = mangoStore((s) => s.wallet.tokens)
  const notEnoughSoLMessage = t('deposit-more-sol')
  const [notificationPosition] = useLocalStorageState(
    NOTIFICATION_POSITION_KEY,
    'bottom-left',
  )
  const [mounted, setMounted] = useState(false)
  const { maxSolDeposit } = useSolBalance()

  // if a notification is shown with {"InstructionError":[0,{"Custom":1}]} then
  // add a notification letting the user know they may not have enough SOL
  useEffect(() => {
    if (transactionNotifications.length) {
      const customErrorNotification = transactionNotifications.find(
        (n) => n.description && n.description.includes('"Custom":1'),
      )
      const notEnoughSolNotification = transactionNotifications.find(
        (n) => n.title && n.title.includes(notEnoughSoLMessage),
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
  }, [transactionNotifications, walletTokens, maxSolDeposit])

  const clearAll = useCallback(() => {
    setMangoStore((s) => {
      const newNotifications = s.transactionNotifications.map((n) => ({
        ...n,
        show: false,
      }))
      s.transactionNotifications = newNotifications
    })
  }, [transactionNotifications])

  const reversedNotifications = [...transactionNotifications].reverse()

  const getPosition = (position: string) => {
    const sharedClasses =
      'pointer-events-none fixed z-50 flex items-end p-4 text-th-fgd-1 md:p-6'
    switch (position) {
      case 'Bottom-Left':
        return 'flex-col bottom-0 left-0 ' + sharedClasses
      case 'Bottom-Right':
        return 'flex-col w-full bottom-0 right-0 ' + sharedClasses
      case 'Top-Left':
        return 'flex-col-reverse top-0 left-0 ' + sharedClasses
      case 'Top-Right':
        return 'flex-col-reverse w-full top-0 right-0 ' + sharedClasses
      default:
        return 'flex-col bottom-0 left-0 ' + sharedClasses
    }
  }

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className={`${getPosition(notificationPosition)} w-full sm:w-auto`}>
      {transactionNotifications.filter((n) => n.show).length > 1 ? (
        <button
          className="pointer-events-auto my-1 flex items-center rounded bg-th-bkg-3 px-2 py-1 text-xs text-th-fgd-3 md:hover:bg-th-bkg-4"
          onClick={clearAll}
        >
          <XMarkIcon className="mr-1 h-3.5 w-3.5" />
          {t('clear-all')}
        </button>
      ) : null}
      {reversedNotifications.map((n) => (
        <TransactionNotification key={n.id} notification={n} />
      ))}
    </div>
  )
}

const TransactionNotification = ({
  notification,
}: {
  notification: TransactionNotification
}) => {
  const [notificationPosition] = useLocalStorageState(
    NOTIFICATION_POSITION_KEY,
    'Bottom-Left',
  )
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0],
  )
  const { type, title, description, txid, show, id } = notification

  // overwrite the title if of the error message if it is a time out error
  let parsedTitle: string | undefined
  if (description) {
    if (
      description.includes('Timed out awaiting') ||
      description.includes('was not confirmed')
    ) {
      parsedTitle = 'Transaction status unknown'
    }
  }

  const parsedDescription = parseDescription(description)

  // if the notification is a success, then hide the confirming tx notification with the same txid
  useEffect(() => {
    if ((type === 'error' || type === 'success') && txid) {
      setMangoStore((s) => {
        const newNotifications = s.transactionNotifications.map((n) =>
          n.txid === txid && n.type === 'confirm' ? { ...n, show: false } : n,
        )
        s.transactionNotifications = newNotifications
      })
    }
  }, [type, txid])

  const hideNotification = useCallback(() => {
    setMangoStore((s) => {
      const newNotifications = s.transactionNotifications.map((n) =>
        n.id === id ? { ...n, show: false } : n,
      )
      s.transactionNotifications = newNotifications
    })
  }, [id])

  // auto hide a notification
  // if no status is provided for a tx notification after 90s, hide it
  useEffect(() => {
    const timeoutInterval =
      parsedTitle || type === 'confirm'
        ? CLIENT_TX_TIMEOUT
        : type === 'error'
        ? 30000
        : type === 'info'
        ? 8000
        : 10000

    const id = setTimeout(() => {
      if (show) {
        hideNotification()
      }
    }, timeoutInterval)

    return () => {
      clearInterval(id)
    }
  }, [hideNotification, parsedTitle, show, type])

  const getTransformClasses = (position: string) => {
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
    switch (position) {
      case 'Bottom-Left':
        return fromLeft
      case 'Bottom-Right':
        return fromRight
      case 'Top-Left':
        return fromLeft
      case 'Top-Right':
        return fromRight
      default:
        return fromLeft
    }
  }

  return (
    <Transition
      className="my-1 w-full sm:w-auto"
      show={show}
      appear={true}
      enter="ease-out duration-500 transition"
      enterFrom={`-translate-y-2 opacity-0 md:translate-y-0 ${
        getTransformClasses(notificationPosition).enterFromClass
      }`}
      enterTo={`translate-y-0 opacity-100 ${
        getTransformClasses(notificationPosition).enterToClass
      }`}
      leave="ease-in duration-200 transition"
      leaveFrom={`translate-y-0 ${
        getTransformClasses(notificationPosition).leaveFromClass
      }`}
      leaveTo={`-translate-y-2 md:translate-y-0 ${
        getTransformClasses(notificationPosition).leaveToClass
      }`}
    >
      <div
        className={`pointer-events-auto w-full rounded-md border bg-th-bkg-2 shadow-lg sm:w-auto ${
          type === 'success'
            ? 'border-th-success'
            : type === 'error'
            ? 'border-th-error'
            : 'border-th-bkg-4'
        }`}
      >
        <div className={`relative flex w-full items-center p-3.5 sm:w-96`}>
          <div className={`mr-1 shrink-0`}>
            {type === 'success' ? (
              <CheckCircleIcon className={`h-6 w-6 text-th-success`} />
            ) : null}
            {type === 'info' && (
              <InformationCircleIcon className={`h-6 w-6 text-th-fgd-3`} />
            )}
            {type === 'error' && (
              <XCircleIcon className={`h-6 w-6 text-th-error`} />
            )}
            {type === 'confirm' && (
              <Loading className="mr-0.5 h-5 w-5 text-th-active" />
            )}
          </div>
          <div className={`ml-2 flex-1`}>
            <p className={`text-th-fgd-1`}>{parsedTitle || title}</p>
            {parsedDescription ? (
              <p
                className={`mb-0 mt-0.5 break-all text-sm leading-tight text-th-fgd-4`}
              >
                <ReactMarkdown
                  components={{ a: LinkRenderer }}
                  className="markdown"
                  remarkPlugins={[remarkGfm]}
                >
                  {parsedDescription}
                </ReactMarkdown>
              </p>
            ) : null}
            {txid ? (
              <a
                href={preferredExplorer.url + txid + '?cluster=' + CLUSTER}
                className="mt-1 flex items-center text-xs text-th-active underline hover:text-th-fgd-2"
                target="_blank"
                rel="noreferrer"
              >
                <div className="break-all">
                  {type === 'error'
                    ? txid
                    : `${txid.slice(0, 14)}...${txid.slice(txid.length - 14)}`}
                </div>
                <ArrowTopRightOnSquareIcon className="mb-0.5 ml-1 h-5 w-5 shrink-0" />
              </a>
            ) : null}
          </div>
          <div className={`absolute right-2 top-2 shrink-0`}>
            <button
              onClick={hideNotification}
              className={`text-th-fgd-4 focus:outline-none md:hover:text-th-fgd-3`}
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

export default TransactionNotificationList

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LinkRenderer(props: any) {
  return (
    // eslint-disable-next-line react/prop-types
    <a href={props.href} target="_blank" rel="noreferrer">
      {/* eslint-disable-next-line react/prop-types */}
      {props.children}
    </a>
  )
}
