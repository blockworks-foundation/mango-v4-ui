import Button, { IconButton } from '@components/shared/Button'
import { Dialog, Transition } from '@headlessui/react'
import { TrashIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { Fragment, useCallback, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { ttCommons, ttCommonsExpanded, ttCommonsMono } from 'utils/fonts'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { HotKey } from '@components/settings/HotKeysSettings'
import { HOT_KEYS_KEY } from 'utils/constants'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import HotKeyModal from '@components/modals/HotKeyModal'
import InlineNotification from '@components/shared/InlineNotification'
import KeyboardIcon from '@components/icons/KeyboardIcon'

const BADGE_CLASSNAMES =
  'mt-2 rounded border border-th-fgd-4 px-1 py-0.5 text-xs text-th-fgd-4'

const HotKeysDrawer = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const { t } = useTranslation(['common', 'settings', 'trade'])
  const [hotKeys, setHotKeys] = useLocalStorageState(HOT_KEYS_KEY, [])
  const [showHotKeyModal, setShowHotKeyModal] = useState(false)

  const handleDeleteKey = useCallback(
    (key: string) => {
      const newKeys = hotKeys.filter((hk: HotKey) => hk.keySequence !== key)
      setHotKeys([...newKeys])
    },
    [hotKeys, setHotKeys],
  )

  return (
    <>
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
              className={`thin-scroll absolute right-0 z-40 h-full w-full overflow-y-auto bg-th-bkg-1 text-left font-body md:w-96 ${ttCommons.variable} ${ttCommonsExpanded.variable} ${ttCommonsMono.variable}`}
            >
              <div className="flex h-16 items-center justify-between border-b border-th-bkg-3 pl-6">
                <h2 className="text-lg">{t('settings:hot-keys')}</h2>
                <div className="flex items-center space-x-4">
                  <Button
                    className="text-th-fgd-2"
                    disabled={hotKeys.length >= 20}
                    onClick={() => setShowHotKeyModal(true)}
                    secondary
                    size="small"
                  >
                    {t('new')}
                  </Button>
                  <button
                    onClick={onClose}
                    className="flex h-16 w-16 items-center justify-center border-l border-th-bkg-3 text-th-fgd-3 focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2"
                  >
                    <XMarkIcon className={`h-5 w-5`} />
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                <p className="mb-4">{t('settings:hot-keys-desc')}</p>
                {hotKeys.length === 20 ? (
                  <div className="mb-4">
                    <InlineNotification
                      type="warning"
                      desc={t('settings:error-key-limit-reached')}
                    />
                  </div>
                ) : null}
                {hotKeys.length ? (
                  <div className="border-b border-th-bkg-3">
                    {hotKeys.map((hk: HotKey) => {
                      const {
                        custom,
                        keySequence,
                        name,
                        orderSide,
                        orderPrice,
                        orderSize,
                        orderSizeType,
                        orderType,
                        ioc,
                        margin,
                        reduceOnly,
                        postOnly,
                      } = hk

                      const options = {
                        margin: margin,
                        IOC: ioc,
                        post: postOnly,
                        reduce: reduceOnly,
                      }

                      const size =
                        orderSizeType === 'percentage'
                          ? t('settings:percentage-of-max', { size: orderSize })
                          : `$${orderSize}`
                      const price = orderPrice
                        ? `${orderPrice}% ${
                            orderSide === 'buy'
                              ? t('settings:below')
                              : t('settings:above')
                          } oracle`
                        : t('trade:market')

                      const selectedMarket =
                        mangoStore.getState().selectedMarket.current
                      return (
                        <div
                          className="flex items-center justify-between border-t border-th-bkg-3 py-4"
                          key={keySequence}
                        >
                          <div>
                            <p className="text-th-fgd-1">{name}</p>
                            <p className="font-bold text-th-active">
                              {keySequence}
                            </p>
                            {!custom ? (
                              <p>{`${t(orderSide)} ${t(
                                `trade:${orderType}`,
                              )}, ${size} at ${price}`}</p>
                            ) : null}
                            {!custom ? (
                              <div className="flex items-center space-x-2">
                                {!options.margin &&
                                selectedMarket instanceof PerpMarket ? (
                                  <div className={BADGE_CLASSNAMES}>
                                    {t('trade:margin')}
                                  </div>
                                ) : null}
                                {Object.entries(options).map((e, i) => {
                                  return e[1] ? (
                                    <div
                                      className={BADGE_CLASSNAMES}
                                      key={e[0] + i}
                                    >
                                      {t(`trade:${e[0]}`)}
                                    </div>
                                  ) : null
                                })}
                              </div>
                            ) : null}
                          </div>
                          <div className="pl-4">
                            <IconButton
                              onClick={() => handleDeleteKey(keySequence)}
                              size="small"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </IconButton>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-8 rounded-lg border border-th-bkg-3 p-6">
                    <div className="flex flex-col items-center">
                      <KeyboardIcon className="mb-2 h-8 w-8 text-th-fgd-4" />
                      <p className="mb-4">{t('settings:no-hot-keys')}</p>
                      <Button onClick={() => setShowHotKeyModal(true)}>
                        <div className="flex items-center">
                          {t('settings:new-hot-key')}
                        </div>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>

      {showHotKeyModal ? (
        <HotKeyModal
          isOpen={showHotKeyModal}
          onClose={() => setShowHotKeyModal(false)}
        />
      ) : null}
    </>
  )
}

export default HotKeysDrawer
