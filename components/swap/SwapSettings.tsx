import { XMarkIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { useEffect, useRef, useState } from 'react'
import mangoStore from '@store/mangoStore'
import ButtonGroup from '../forms/ButtonGroup'
import Input from '../forms/Input'
import Button, { IconButton, LinkButton } from '../shared/Button'

const slippagePresets = ['0.1', '0.5', '1', '2']

const SwapSettings = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation(['common', 'settings', 'swap'])
  const slippage = mangoStore((s) => s.swap.slippage)
  const set = mangoStore((s) => s.set)
  const focusRef = useRef<HTMLButtonElement>(null)

  const [showCustomSlippageForm, setShowCustomSlippageForm] = useState(false)
  const [inputValue, setInputValue] = useState(slippage.toString())

  useEffect(() => {
    if (!slippagePresets.includes(slippage.toString())) {
      setShowCustomSlippageForm(true)
    }
  }, [])

  const handleSetSlippage = (slippage: string, close?: boolean) => {
    set((s) => {
      s.swap.slippage = parseFloat(slippage)
    })
    if (close) {
      onClose()
    }
  }

  useEffect(() => {
    if (focusRef?.current) {
      focusRef.current.focus()
    }
  }, [focusRef])

  return (
    <>
      <h3 className="mb-3">{t('settings')}</h3>
      <IconButton
        className="absolute right-2 top-2"
        onClick={onClose}
        hideBg
        ref={focusRef}
      >
        <XMarkIcon className="h-6 w-6" />
      </IconButton>

      <div className="mt-4">
        <div className="mb-2 flex justify-between">
          <p className="text-th-fgd-2">{t('swap:max-slippage')}</p>
          <LinkButton
            onClick={() => setShowCustomSlippageForm(!showCustomSlippageForm)}
          >
            {showCustomSlippageForm ? t('swap:preset') : t('settings:custom')}
          </LinkButton>
        </div>
        {showCustomSlippageForm ? (
          <>
            <Input
              type="text"
              placeholder="0.00"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              suffix="%"
            />
            <Button
              disabled={
                !inputValue ||
                isNaN(Number(inputValue)) ||
                parseFloat(inputValue) <= 0
              }
              className="mt-4"
              onClick={() => handleSetSlippage(inputValue, true)}
            >
              {t('save')}
            </Button>
          </>
        ) : (
          <>
            <ButtonGroup
              activeValue={slippage.toString()}
              className="h-10 font-mono"
              onChange={(v) => handleSetSlippage(v)}
              unit="%"
              values={slippagePresets}
            />
            <Button className="mt-4" onClick={() => onClose()}>
              {t('save')}
            </Button>
          </>
        )}
      </div>
    </>
  )
}

export default SwapSettings
