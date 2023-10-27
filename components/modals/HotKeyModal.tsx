import ButtonGroup from '@components/forms/ButtonGroup'
import Checkbox from '@components/forms/Checkbox'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import { HotKey } from '@components/settings/HotKeysSettings'
import Button from '@components/shared/Button'
import InlineNotification from '@components/shared/InlineNotification'
import Modal from '@components/shared/Modal'
import TabUnderline from '@components/shared/TabUnderline'
import Tooltip from '@components/shared/Tooltip'
import { CheckIcon } from '@heroicons/react/20/solid'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalProps } from 'types/modal'
import { HOT_KEYS_KEY } from 'utils/constants'

type FormErrors = Partial<Record<keyof HotKeyForm, string>>

type HotKeyForm = {
  custom?: string
  name?: string
  baseKey: string
  triggerKey: string
  price: string
  side: 'buy' | 'sell'
  size: string
  sizeType: 'percentage' | 'notional'
  orderType: 'limit' | 'market'
  ioc: boolean
  post: boolean
  margin: boolean
  reduce: boolean
}

type TEMPLATE = {
  custom?: string
  price: string
  side: 'buy' | 'sell'
  size: string
  sizeType: 'percentage' | 'notional'
  orderType: 'limit' | 'market'
  ioc: boolean
  post: boolean
  margin: boolean
  reduce: boolean
}

type CUSTOM_TEMPLATE = {
  custom: string
  side?: 'buy' | 'sell'
  orderType?: 'limit' | 'market'
  reduce?: boolean
}

export enum HOTKEY_TEMPLATES {
  CLOSE_LONG = 'Market close long position',
  CLOSE_SHORT = 'Market close short position',
  CLOSE_ALL_PERP = 'Market close all perp positions',
}

const TEMPLATE_BUTTON_CLASSES =
  'flex w-full items-center justify-between border-t border-th-bkg-3 p-4 focus:outline-none md:hover:bg-th-bkg-2'

const DEFAULT_FORM_VALUES: HotKeyForm = {
  custom: '',
  name: '',
  baseKey: 'shift',
  triggerKey: '',
  price: '',
  side: 'buy',
  size: '',
  sizeType: 'percentage',
  orderType: 'limit',
  ioc: false,
  post: false,
  margin: false,
  reduce: false,
}

const CLOSE_LONG: CUSTOM_TEMPLATE = {
  custom: HOTKEY_TEMPLATES.CLOSE_LONG,
  side: 'sell',
  orderType: 'market',
  reduce: true,
}

const CLOSE_SHORT: CUSTOM_TEMPLATE = {
  custom: HOTKEY_TEMPLATES.CLOSE_SHORT,
  side: 'buy',
  orderType: 'market',
  reduce: true,
}

const CLOSE_ALL_PERP: CUSTOM_TEMPLATE = {
  custom: HOTKEY_TEMPLATES.CLOSE_ALL_PERP,
}

const TABS = ['settings:templates', 'settings:custom']

const HotKeyModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation(['common', 'settings', 'trade'])
  const [activeTab, setActiveTab] = useState('settings:templates')
  const [selectedTemplate, setSelectedTemplate] = useState<
    HOTKEY_TEMPLATES | ''
  >('')
  const [hotKeys, setHotKeys] = useLocalStorageState<HotKey[]>(HOT_KEYS_KEY, [])
  const [hotKeyForm, setHotKeyForm] = useState<HotKeyForm>({
    ...DEFAULT_FORM_VALUES,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const handleSwitchTab = (tab: string) => {
    setActiveTab(tab)
    setHotKeyForm({
      ...DEFAULT_FORM_VALUES,
      name: hotKeyForm.name,
      triggerKey: hotKeyForm.triggerKey,
    })
    setFormErrors({})
    setSelectedTemplate('')
  }

  const handleSetForm = (propertyName: string, value: string | boolean) => {
    setFormErrors({})
    setHotKeyForm((prevState) => ({ ...prevState, [propertyName]: value }))
  }

  const handleSetTemplate = (
    template: TEMPLATE | CUSTOM_TEMPLATE,
    templateName: HOTKEY_TEMPLATES,
  ) => {
    setFormErrors({})
    setHotKeyForm((prevState) => ({ ...prevState, ...template }))
    setSelectedTemplate(templateName)
  }

  const handlePostOnlyChange = (postOnly: boolean) => {
    if (postOnly) {
      handleSetForm('ioc', !postOnly)
    }
    handleSetForm('post', postOnly)
  }

  const handleIocChange = (ioc: boolean) => {
    if (ioc) {
      handleSetForm('post', !ioc)
    }
    handleSetForm('ioc', ioc)
  }

  const isFormValid = (form: HotKeyForm) => {
    const invalidFields: FormErrors = {}
    setFormErrors({})
    const triggerKey: (keyof HotKeyForm)[] = ['triggerKey']
    const requiredFields: (keyof HotKeyForm)[] = ['size', 'price', 'triggerKey']
    const numberFields: (keyof HotKeyForm)[] = ['size', 'price']
    const alphanumericRegex = /^[a-zA-Z0-9]+$/
    for (const key of triggerKey) {
      const value = form[key] as string
      if (value.length > 1) {
        invalidFields[key] = t('settings:error-too-many-characters')
      }
      if (!alphanumericRegex.test(value)) {
        invalidFields[key] = t('settings:error-alphanumeric-only')
      }
    }
    for (const key of requiredFields) {
      const value = form[key] as string
      if (!value) {
        if (hotKeyForm.orderType === 'market') {
          if (key !== 'price') {
            invalidFields[key] = t('settings:error-required-field')
          }
        } else {
          invalidFields[key] = t('settings:error-required-field')
        }
      }
    }
    for (const key of numberFields) {
      const value = form[key] as string
      if (value) {
        if (isNaN(parseFloat(value))) {
          invalidFields[key] = t('settings:error-must-be-number')
        }
        if (parseFloat(value) < 0) {
          invalidFields[key] = t('settings:error-must-be-above-zero')
        }
        if (parseFloat(value) > 100) {
          if (key === 'price') {
            invalidFields[key] = t('settings:error-must-be-below-100')
          } else {
            if (hotKeyForm.sizeType === 'percentage') {
              invalidFields[key] = t('settings:error-must-be-below-100')
            }
          }
        }
      }
    }
    const newKeySequence = `${form.baseKey}+${form.triggerKey}`
    const keyExists = hotKeys.find((k) => k.keySequence === newKeySequence)
    if (keyExists) {
      invalidFields.triggerKey = t('settings:error-key-in-use')
    }
    if (Object.keys(invalidFields).length) {
      setFormErrors(invalidFields)
    }
    return invalidFields
  }

  const handleSave = () => {
    const invalidFields = isFormValid(hotKeyForm)
    if (Object.keys(invalidFields).length && !hotKeyForm.custom) {
      return
    }
    const name = hotKeyForm.name ? hotKeyForm.name : selectedTemplate || ''
    const newHotKey = !hotKeyForm.custom
      ? {
          keySequence: `${hotKeyForm.baseKey}+${hotKeyForm.triggerKey}`,
          custom: hotKeyForm.custom,
          name: name,
          orderSide: hotKeyForm.side,
          orderSizeType: hotKeyForm.sizeType,
          orderSize: hotKeyForm.size,
          orderType: hotKeyForm.orderType,
          orderPrice: hotKeyForm.price,
          ioc: hotKeyForm.ioc,
          margin: hotKeyForm.margin,
          postOnly: hotKeyForm.post,
          reduceOnly: hotKeyForm.reduce,
        }
      : {
          keySequence: `${hotKeyForm.baseKey}+${hotKeyForm.triggerKey}`,
          custom: hotKeyForm.custom,
          name: name,
          orderSide: hotKeyForm.side,
          orderType: hotKeyForm.orderType,
          reduceOnly: hotKeyForm.reduce,
        }
    setHotKeys([...hotKeys, newHotKey])
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassNames="md:max-h-[calc(100vh-10%)] overflow-y-auto thin-scroll"
    >
      <>
        <h2 className="mb-4 text-center">{t('settings:new-hot-key')}</h2>
        <div className="mb-4">
          <Label text={t('settings:base-key')} />
          <ButtonGroup
            activeValue={hotKeyForm.baseKey}
            onChange={(key) => handleSetForm('baseKey', key)}
            values={['shift', 'ctrl']}
          />
        </div>
        <div className="mb-4">
          <Label text={t('settings:trigger-key')} />
          <Input
            hasError={formErrors.triggerKey !== undefined}
            type="text"
            value={hotKeyForm.triggerKey}
            onChange={(e) =>
              handleSetForm('triggerKey', e.target.value.toLowerCase())
            }
          />
          {formErrors.triggerKey ? (
            <div className="mt-1">
              <InlineNotification
                type="error"
                desc={formErrors.triggerKey}
                hideBorder
                hidePadding
              />
            </div>
          ) : null}
        </div>
        <div className="mb-4">
          <Label text={t('settings:nickname')} optional />
          <Input
            type="text"
            value={hotKeyForm.name || ''}
            onChange={(e) =>
              handleSetForm('name', e.target.value.toLowerCase())
            }
          />
        </div>
        <div className="pb-2">
          <TabUnderline
            activeValue={activeTab}
            values={TABS}
            onChange={(v) => handleSwitchTab(v)}
          />
        </div>
        {activeTab === 'settings:templates' ? (
          <div className="border-b border-th-bkg-3">
            <button
              className={TEMPLATE_BUTTON_CLASSES}
              onClick={() =>
                handleSetTemplate(CLOSE_LONG, HOTKEY_TEMPLATES.CLOSE_LONG)
              }
            >
              <span className="text-th-fgd-2">
                {HOTKEY_TEMPLATES.CLOSE_LONG}
              </span>
              <TemplateCheckMark
                isActive={selectedTemplate === HOTKEY_TEMPLATES.CLOSE_LONG}
              />
            </button>
            <button
              className={TEMPLATE_BUTTON_CLASSES}
              onClick={() =>
                handleSetTemplate(CLOSE_SHORT, HOTKEY_TEMPLATES.CLOSE_SHORT)
              }
            >
              <span className="text-th-fgd-2">
                {HOTKEY_TEMPLATES.CLOSE_SHORT}
              </span>
              <TemplateCheckMark
                isActive={selectedTemplate === HOTKEY_TEMPLATES.CLOSE_SHORT}
              />
            </button>
            <button
              className={TEMPLATE_BUTTON_CLASSES}
              onClick={() =>
                handleSetTemplate(
                  CLOSE_ALL_PERP,
                  HOTKEY_TEMPLATES.CLOSE_ALL_PERP,
                )
              }
            >
              <span className="text-th-fgd-2">
                {HOTKEY_TEMPLATES.CLOSE_ALL_PERP}
              </span>
              <TemplateCheckMark
                isActive={selectedTemplate === HOTKEY_TEMPLATES.CLOSE_ALL_PERP}
              />
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Label text={t('settings:order-side')} />
              <ButtonGroup
                activeValue={hotKeyForm.side}
                names={[t('buy'), t('sell')]}
                onChange={(side) => handleSetForm('side', side)}
                values={['buy', 'sell']}
              />
            </div>
            <div className="mb-4">
              <Label text={t('trade:order-type')} />
              <ButtonGroup
                activeValue={hotKeyForm.orderType}
                names={[t('trade:limit'), t('market')]}
                onChange={(type) => handleSetForm('orderType', type)}
                values={['limit', 'market']}
              />
            </div>
            <div className="mb-4">
              <Label text={t('settings:order-size-type')} />
              <ButtonGroup
                activeValue={hotKeyForm.sizeType}
                names={[t('settings:percentage'), t('settings:notional')]}
                onChange={(type) => handleSetForm('sizeType', type)}
                values={['percentage', 'notional']}
              />
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-full">
                <Tooltip
                  content={
                    hotKeyForm.sizeType === 'notional'
                      ? t('settings:tooltip-hot-key-notional-size')
                      : t('settings:tooltip-hot-key-percentage-size')
                  }
                >
                  <Label className="tooltip-underline" text={t('trade:size')} />
                </Tooltip>
                <Input
                  hasError={formErrors.size !== undefined}
                  type="text"
                  value={hotKeyForm.size}
                  onChange={(e) => handleSetForm('size', e.target.value)}
                  suffix={hotKeyForm.sizeType === 'percentage' ? '%' : 'USD'}
                />
                {formErrors.size ? (
                  <div className="mt-1">
                    <InlineNotification
                      type="error"
                      desc={formErrors.size}
                      hideBorder
                      hidePadding
                    />
                  </div>
                ) : null}
              </div>
              {hotKeyForm.orderType === 'limit' ? (
                <div className="w-full">
                  <Tooltip content={t('settings:tooltip-hot-key-price')}>
                    <Label className="tooltip-underline" text={t('price')} />
                  </Tooltip>
                  <Input
                    hasError={formErrors.price !== undefined}
                    type="text"
                    value={hotKeyForm.price}
                    onChange={(e) => handleSetForm('price', e.target.value)}
                    placeholder="e.g. 1%"
                    suffix="%"
                  />
                  {formErrors.price ? (
                    <div className="mt-1">
                      <InlineNotification
                        type="error"
                        desc={formErrors.price}
                        hideBorder
                        hidePadding
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap md:flex-nowrap">
              {hotKeyForm.orderType === 'limit' ? (
                <div className="flex">
                  <div className="mr-3 mt-4" id="trade-step-six">
                    <Tooltip
                      className="hidden md:block"
                      delay={100}
                      content={t('trade:tooltip-post')}
                    >
                      <Checkbox
                        checked={hotKeyForm.post}
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
                          checked={hotKeyForm.ioc}
                          onChange={(e) => handleIocChange(e.target.checked)}
                        >
                          IOC
                        </Checkbox>
                      </div>
                    </Tooltip>
                  </div>
                </div>
              ) : null}
              <div className="mr-3 mt-4" id="trade-step-eight">
                <Tooltip
                  className="hidden md:block"
                  delay={100}
                  content={t('trade:tooltip-enable-margin')}
                >
                  <Checkbox
                    checked={hotKeyForm.margin}
                    onChange={(e) => handleSetForm('margin', e.target.checked)}
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
                      checked={hotKeyForm.reduce}
                      onChange={(e) =>
                        handleSetForm('reduce', e.target.checked)
                      }
                    >
                      {t('trade:reduce-only')}
                    </Checkbox>
                  </div>
                </Tooltip>
              </div>
            </div>
          </>
        )}
        <Button className="mt-6 w-full" onClick={handleSave}>
          {t('settings:save-hot-key')}
        </Button>
      </>
    </Modal>
  )
}

export default HotKeyModal

const TemplateCheckMark = ({ isActive }: { isActive: boolean }) => {
  return isActive ? (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-th-success">
      <CheckIcon className="h-4 w-4 text-th-bkg-1" />
    </div>
  ) : (
    <div className="h-5 w-5 rounded-full bg-th-bkg-4" />
  )
}
