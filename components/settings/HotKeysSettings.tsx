import ButtonGroup from '@components/forms/ButtonGroup'
import Checkbox from '@components/forms/Checkbox'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button, { LinkButton } from '@components/shared/Button'
import Modal from '@components/shared/Modal'
import Tooltip from '@components/shared/Tooltip'
import { KeyIcon } from '@heroicons/react/20/solid'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { useCallback, useState } from 'react'
import { ModalProps } from 'types/modal'
import { HOT_KEYS_KEY } from 'utils/constants'

export type HotKey = {
  ioc: boolean
  keySequence: string
  // market: string
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
  const { t } = useTranslation('settings')
  const [hotKeys] = useLocalStorageState(HOT_KEYS_KEY, [])
  const [showHotKeyModal, setShowHotKeyModal] = useState(false)
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="mb-1 text-base">{t('hot-keys')}</h2>
        <LinkButton onClick={() => setShowHotKeyModal(true)}>
          Create New Hot Key
        </LinkButton>
      </div>
      <p className="mb-4">{t('hot-keys-desc')}</p>
      {hotKeys.length ? (
        hotKeys.map((k: HotKey) => (
          <div key={k.keySequence}>
            <p>{k.keySequence}</p>
          </div>
        ))
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

// add ioc, postOnly and reduceOnly checkboxes
const HotKeyModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation(['settings', 'trade'])
  const [hotKeys, setHotKeys] = useLocalStorageState<HotKey[]>(HOT_KEYS_KEY, [])
  // const perpMarkets = mangoStore((s) => s.perpMarkets)
  // const serumMarkets = mangoStore((s) => s.serumMarkets)
  // const allMarkets =
  //   perpMarkets.length && serumMarkets.length
  //     ? [
  //         'All',
  //         ...perpMarkets.map((m) => m.name),
  //         ...serumMarkets.map((m) => m.name),
  //       ]
  //     : ['All']
  const [keySequence, setKeySequence] = useState('')
  // const [market, setMarket] = useState('All')
  const [orderPrice, setOrderPrice] = useState('')
  const [orderSide, setOrderSide] = useState('buy')
  const [orderSizeType, setOrderSizeType] = useState('percentage')
  const [orderSize, setOrderSize] = useState('')
  const [orderType, setOrderType] = useState('limit')
  const [postOnly, setPostOnly] = useState(false)
  const [ioc, setIoc] = useState(false)
  const [margin, setMargin] = useState(false)
  const [reduceOnly, setReduceOnly] = useState(false)

  const handlePostOnlyChange = useCallback(
    (postOnly: boolean) => {
      let updatedIoc = ioc
      if (postOnly) {
        updatedIoc = !postOnly
      }
      setPostOnly(postOnly)
      setIoc(updatedIoc)
    },
    [ioc]
  )

  const handleIocChange = useCallback(
    (ioc: boolean) => {
      let updatedPostOnly = postOnly
      if (ioc) {
        updatedPostOnly = !ioc
      }
      setPostOnly(updatedPostOnly)
      setIoc(ioc)
    },
    [postOnly]
  )

  const handleSave = () => {
    const newHotKey = {
      keySequence: keySequence,
      // market: market,
      orderSide: orderSide,
      orderSizeType: orderSizeType,
      orderSize: orderSize,
      orderType: orderType,
      orderPrice: orderPrice,
      ioc,
      margin,
      postOnly,
      reduceOnly,
    }
    setHotKeys([...hotKeys, newHotKey])
    onClose()
  }

  const disabled =
    !keySequence || (orderType === 'limit' && !orderPrice) || !orderSize
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
        {/* <div className="mb-4">
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
        </div> */}
        <div className="mb-4">
          <Label text={t('order-side')} />
          <ButtonGroup
            activeValue={orderSide}
            onChange={(side) => setOrderSide(side)}
            values={['buy', 'sell']}
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
        <div className="flex flex-wrap md:flex-nowrap">
          {orderType === 'limit' ? (
            <div className="flex">
              <div className="mr-3 mt-4" id="trade-step-six">
                <Tooltip
                  className="hidden md:block"
                  delay={100}
                  content={t('trade:tooltip-post')}
                >
                  <Checkbox
                    checked={postOnly}
                    onChange={(e) => handlePostOnlyChange(e.target.checked)}
                  >
                    {t('trade:post')}
                  </Checkbox>
                </Tooltip>
              </div>
              <div className="mr-3 mt-4" id="trade-step-seven">
                <Tooltip
                  className="hidden md:block"
                  delay={100}
                  content={t('trade:tooltip-ioc')}
                >
                  <div className="flex items-center text-xs text-th-fgd-3">
                    <Checkbox
                      checked={ioc}
                      onChange={(e) => handleIocChange(e.target.checked)}
                    >
                      IOC
                    </Checkbox>
                  </div>
                </Tooltip>
              </div>
            </div>
          ) : null}
          <div className="mt-4 mr-3" id="trade-step-eight">
            <Tooltip
              className="hidden md:block"
              delay={100}
              content={t('trade:tooltip-enable-margin')}
            >
              <Checkbox
                checked={margin}
                onChange={(e) => setMargin(e.target.checked)}
              >
                {t('trade:margin')}
              </Checkbox>
            </Tooltip>
          </div>
          <div className="mr-3 mt-4">
            <Tooltip
              className="hidden md:block"
              delay={100}
              content={
                'Reduce will only decrease the size of an open position. This is often used for closing a position.'
              }
            >
              <div className="flex items-center text-xs text-th-fgd-3">
                <Checkbox
                  checked={reduceOnly}
                  onChange={(e) => setReduceOnly(e.target.checked)}
                >
                  {t('trade:reduce-only')}
                </Checkbox>
              </div>
            </Tooltip>
          </div>
        </div>
        <Button
          className="mt-6 w-full"
          disabled={disabled}
          onClick={handleSave}
        >
          {t('save-hot-key')}
        </Button>
      </>
    </Modal>
  )
}
