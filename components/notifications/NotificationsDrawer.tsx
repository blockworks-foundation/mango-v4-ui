import Button, { IconButton, LinkButton } from '@components/shared/Button'
import { Dialog, Transition } from '@headlessui/react'
import {
  CalendarIcon,
  FaceSmileIcon,
  InboxIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { WalletContextState, useWallet } from '@solana/wallet-adapter-react'
import { Payload, SIWS } from '@web3auth/sign-in-with-solana'
import { useHeaders } from 'hooks/notifications/useHeaders'
import { useIsAuthorized } from 'hooks/notifications/useIsAuthorized'
import { useNotifications } from 'hooks/notifications/useNotifications'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { NOTIFICATION_API } from 'utils/constants'
import NotificationCookieStore from '@store/notificationCookieStore'
import dayjs from 'dayjs'
import { useTranslation } from 'next-i18next'
import { notify } from 'utils/notifications'

export const createSolanaMessage = (
  wallet: WalletContextState,
  setCookie: (wallet: string, token: string) => void,
) => {
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

  wallet.signMessage!(messageEncoded)
    .then(async (resp) => {
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
      const body = await tokenResp.json()
      const token = body.token
      const error = body.error
      if (error) {
        notify({
          type: 'error',
          title: 'Error',
          description: error,
        })
        return
      }
      setCookie(payload.address, token)
    })
    .catch((e) => {
      notify({
        type: 'error',
        title: 'Error',
        description: e.message ? e.message : `${e}`,
      })
    })
}

const NotificationsDrawer = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const { t } = useTranslation('notifications')
  const { data, refetch } = useNotifications()
  const wallet = useWallet()
  const isAuth = useIsAuthorized()
  const headers = useHeaders()
  const setCookie = NotificationCookieStore((s) => s.setCookie)
  const [isRemoving, setIsRemoving] = useState(false)

  const unseenNotifications = useMemo(() => {
    if (!data || !data.length) return []
    return data.filter((x) => !x.seen)
  }, [data])

  const markAsSeen = useCallback(
    async (ids: number[]) => {
      try {
        const resp = await fetch(`${NOTIFICATION_API}notifications/seen`, {
          method: 'POST',
          headers: headers.headers,
          body: JSON.stringify({
            ids: ids,
            seen: true,
          }),
        })
        const body = await resp.json()
        const error = body.error
        if (error) {
          notify({
            type: 'error',
            title: 'Error',
            description: error,
          })
          return
        }
        refetch()
      } catch (e) {
        notify({
          type: 'error',
          title: 'Error',
          description: JSON.stringify(e),
        })
      }
    },
    [NOTIFICATION_API, headers],
  )

  const remove = useCallback(
    async (ids: number[]) => {
      setIsRemoving(true)
      try {
        const resp = await fetch(
          `${NOTIFICATION_API}notifications/removeForUser`,
          {
            method: 'POST',
            headers: headers.headers,
            body: JSON.stringify({
              ids: ids,
            }),
          },
        )
        const body = await resp.json()
        const error = body.error
        if (error) {
          notify({
            type: 'error',
            title: 'Error',
            description: error,
          })
          return
        }
        refetch()
      } catch (e) {
        notify({
          type: 'error',
          title: 'Error',
          description: JSON.stringify(e),
        })
      }
      setIsRemoving(false)
    },
    [NOTIFICATION_API, headers],
  )

  // Mark all notifications as seen when the inbox is opened
  useEffect(() => {
    if (isOpen && unseenNotifications?.length) {
      markAsSeen([...unseenNotifications.map((x) => x.id)])
    }
  }, [isOpen, unseenNotifications])

  return (
    <Transition show={isOpen}>
      <Dialog className="fixed inset-0 left-0 z-30" onClose={onClose}>
        <Transition.Child
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          as={Fragment}
        >
          <div className="fixed inset-0 z-40 cursor-default bg-black bg-opacity-30" />
        </Transition.Child>
        <Transition.Child
          enter="transition ease-in duration-300"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-out duration-300"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
          as={Fragment}
        >
          <Dialog.Panel
            className={`thin-scroll absolute right-0 z-40 h-full w-full overflow-y-auto bg-th-bkg-1 text-left md:w-96`}
          >
            <div className="flex h-16 items-center justify-between border-b border-th-bkg-3 pl-6">
              <h2 className="text-lg">{t('notifications')}</h2>
              <div className="flex items-center">
                {data?.length ? (
                  <LinkButton
                    disabled={isRemoving}
                    className="mr-4 flex items-center text-xs"
                    onClick={() => remove(data.map((n) => n.id))}
                  >
                    <TrashIcon className="mr-1 h-3 w-3" />
                    <span>{t('clear-all')}</span>
                  </LinkButton>
                ) : null}
                <button
                  onClick={onClose}
                  className="flex h-16 w-16 items-center justify-center border-l border-th-bkg-3 text-th-fgd-3 focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2"
                >
                  <XMarkIcon className={`h-5 w-5`} />
                </button>
              </div>
            </div>
            {isAuth ? (
              <>
                {data?.length ? (
                  <>
                    <div className="space-y-4 border-b border-th-bkg-3 pb-4">
                      {data?.map((notification) => (
                        <div
                          className="border-t border-th-bkg-3 pt-4 first:border-t-0"
                          key={notification.id}
                        >
                          <div className="px-6">
                            <div className="mb-1 flex items-start justify-between">
                              <h4 className="mr-4">{notification.title}</h4>
                              <IconButton
                                disabled={isRemoving}
                                onClick={() => remove([notification.id])}
                                className="mt-1 text-th-fgd-3"
                                hideBg
                              >
                                <TrashIcon className="h-4 w-4" />
                              </IconButton>
                            </div>
                            <div className="mb-2 flex items-center text-th-fgd-4">
                              <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                              <p className="text-xs">
                                {dayjs(notification.createdAt).format(
                                  'DD MMM YYYY, h:mma',
                                )}
                              </p>
                            </div>
                            <p>{notification.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="relative top-1/2 flex -translate-y-1/2 flex-col justify-center px-6 pb-20">
                    <div className="flex flex-col items-center justify-center text-center">
                      <FaceSmileIcon className="mb-2 h-7 w-7 text-th-fgd-2" />
                      <h3 className="mb-1 text-base">
                        {t('empty-state-title')}
                      </h3>
                      <p>{t('empty-state-desc')}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="relative top-1/2 flex -translate-y-1/2 flex-col justify-center px-6 pb-20">
                <div className="flex flex-col items-center justify-center text-center">
                  <InboxIcon className="mb-2 h-7 w-7 text-th-fgd-2" />
                  <h3 className="mb-1 text-base">{t('unauth-title')}</h3>
                  <p>{t('unauth-desc')}</p>
                  <Button
                    className="mt-6"
                    onClick={() => createSolanaMessage(wallet, setCookie)}
                  >
                    {t('sign-message')}
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  )
}

export default NotificationsDrawer
