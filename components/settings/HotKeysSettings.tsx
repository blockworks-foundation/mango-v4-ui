import KeyboardIcon from '@components/icons/KeyboardIcon'
import HotKeyModal from '@components/modals/HotKeyModal'
import Button, { IconButton } from '@components/shared/Button'
import InlineNotification from '@components/shared/InlineNotification'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { TrashIcon } from '@heroicons/react/20/solid'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import { HOT_KEYS_KEY } from 'utils/constants'

export type HotKey = {
  ioc: boolean
  keySequence: string
  margin: boolean
  orderSide: 'buy' | 'sell'
  orderSizeType: 'percentage' | 'notional'
  orderSize: string
  orderType: 'limit' | 'market'
  orderPrice: string
  postOnly: boolean
  reduceOnly: boolean
}

const HotKeysSettings = () => {
  const { t } = useTranslation(['common', 'settings', 'trade'])
  const [hotKeys, setHotKeys] = useLocalStorageState(HOT_KEYS_KEY, [])
  const [showHotKeyModal, setShowHotKeyModal] = useState(false)

  const handleDeleteKey = (key: string) => {
    const newKeys = hotKeys.filter((hk: HotKey) => hk.keySequence !== key)
    setHotKeys([...newKeys])
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="pr-6">
          <p>{t('settings:hot-keys-desc')}</p>
        </div>
        {hotKeys.length ? (
          <Button
            className="whitespace-nowrap"
            disabled={hotKeys.length >= 20}
            onClick={() => setShowHotKeyModal(true)}
            secondary
          >
            {t('settings:new-hot-key')}
          </Button>
        ) : null}
      </div>
      {hotKeys.length === 20 ? (
        <div className="mb-4">
          <InlineNotification
            type="warning"
            desc={t('settings:error-key-limit-reached')}
          />
        </div>
      ) : null}
      {hotKeys.length ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">{t('settings:key-sequence')}</Th>
              <Th className="text-right">{t('trade:order-type')}</Th>
              <Th className="text-right">{t('trade:side')}</Th>
              <Th className="text-right">{t('trade:size')}</Th>
              <Th className="text-right">{t('price')}</Th>
              <Th className="text-right">{t('settings:options')}</Th>
              <Th />
            </TrHead>
          </thead>
          <tbody>
            {hotKeys.map((hk: HotKey) => {
              const {
                keySequence,
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

              const options = {
                margin: margin,
                IOC: ioc,
                post: postOnly,
                reduce: reduceOnly,
              }

              return (
                <TrBody key={keySequence} className="text-right text-th-fgd-2">
                  <Td className="text-left">{keySequence}</Td>
                  <Td className="text-right">{t(`trade:${orderType}`)}</Td>
                  <Td className="text-right">{t(orderSide)}</Td>
                  <Td className="text-right">{size}</Td>
                  <Td className="text-right">{price}</Td>
                  <Td className="text-right">
                    {Object.entries(options).map((e) => {
                      return e[1]
                        ? `${e[0] !== 'margin' ? ', ' : ''}${t(
                            `trade:${e[0]}`,
                          )}`
                        : ''
                    })}
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <IconButton
                        onClick={() => handleDeleteKey(keySequence)}
                        size="small"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </Td>
                </TrBody>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <div className="rounded-lg border border-th-bkg-3 p-6">
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
      {showHotKeyModal ? (
        <HotKeyModal
          isOpen={showHotKeyModal}
          onClose={() => setShowHotKeyModal(false)}
        />
      ) : null}
    </>
  )
}

export default HotKeysSettings
