import ButtonGroup from '@components/forms/ButtonGroup'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Select from '@components/forms/Select'
import Button from '@components/shared/Button'
import Modal from '@components/shared/Modal'
import Tooltip from '@components/shared/Tooltip'
import { KeyIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import { ModalProps } from 'types/modal'
import { HOT_KEYS_KEY } from 'utils/constants'

const HotKeysSettings = () => {
  const { t } = useTranslation('settings')
  const [hotKeys] = useLocalStorageState(HOT_KEYS_KEY, [])
  const [showHotKeyModal, setShowHotKeyModal] = useState(false)
  return (
    <>
      <h2 className="mb-1 text-base">{t('hot-keys')}</h2>
      <p className="mb-4">{t('hot-keys-desc')}</p>
      {hotKeys.length ? (
        <div></div>
      ) : (
        <div className="mb-8 rounded-lg border border-th-bkg-3 p-6">
          <div className="flex flex-col items-center">
            <KeyIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
            <p className="mb-4">{t('no-hot-keys')}</p>
            <Button onClick={() => setShowHotKeyModal(true)}>
              <div className="flex items-center">{t('create-hot-key')}</div>
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

// type HotKey = {
//   keySequence: string
//   market: string
//   orderSide: 'buy/long' | 'sell/short'
//   orderSizeType: 'percentage' | 'notional'
//   orderSize: string
//   orderType: 'limit' | 'market'
//   orderPrice: string
// }

const HotKeyModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('settings')
  const perpMarkets = mangoStore((s) => s.perpMarkets)
  const serumMarkets = mangoStore((s) => s.serumMarkets)
  const allMarkets =
    perpMarkets.length && serumMarkets.length
      ? [
          'All',
          ...perpMarkets.map((m) => m.name),
          ...serumMarkets.map((m) => m.name),
        ]
      : ['All']
  const [keySequence, setKeySequence] = useState('')
  const [market, setMarket] = useState('All')
  const [orderPrice, setOrderPrice] = useState('')
  const [orderSide, setOrderSide] = useState('buy/long')
  const [orderSizeType, setOrderSizeType] = useState('percentage')
  const [orderSize, setOrderSize] = useState('')
  const [orderType, setOrderType] = useState('limit')
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <>
        <h2 className="mb-4 text-center">{t('create-hot-key')}</h2>
        <div className="mb-4">
          <Label text={t('key-sequence')} />
          <Input
            type="text"
            value={keySequence}
            onChange={(e) => setKeySequence(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <Label text={t('market')} />
          <Select
            value={market}
            onChange={(market) => setMarket(market)}
            className="w-full"
          >
            {allMarkets.map((market) => (
              <Select.Option key={market} value={market}>
                <div className="w-full">{market}</div>
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="mb-4">
          <Label text={t('order-side')} />
          <ButtonGroup
            activeValue={orderSide}
            onChange={(side) => setOrderSide(side)}
            values={['buy/long', 'sell/short']}
          />
        </div>
        <div className="mb-4">
          <Label text={t('order-type')} />
          <ButtonGroup
            activeValue={orderType}
            onChange={(type) => setOrderType(type)}
            values={['limit', 'market']}
          />
        </div>
        <div className="mb-4">
          <Label text={t('order-size-type')} />
          <ButtonGroup
            activeValue={orderSizeType}
            onChange={(type) => setOrderSizeType(type)}
            values={['percentage', 'notional']}
          />
        </div>
        <div>
          <Label text={t('size')} />
          <Input
            type="text"
            value={orderSize}
            onChange={(e) => setOrderSize(e.target.value)}
            suffix={orderSizeType === 'percentage' ? '%' : 'USD'}
          />
        </div>
        {orderType === 'limit' ? (
          <div className="mt-4">
            <Tooltip content="Set a price as a percentage change from the oracle price">
              <Label className="tooltip-underline" text={t('price')} />
            </Tooltip>
            <Input
              type="text"
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              placeholder="e.g. 1%"
              suffix="%"
            />
          </div>
        ) : null}
        <Button className="mt-6 w-full">{t('save-hot-key')}</Button>
      </>
    </Modal>
  )
}
