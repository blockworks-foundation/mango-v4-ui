import { XMarkIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { useEffect, useState } from 'react'
import mangoStore from '@store/mangoStore'
import ButtonGroup from '../forms/ButtonGroup'
import Input from '../forms/Input'
import Button, { IconButton, LinkButton } from '../shared/Button'

const slippagePresets = ['0.1', '0.5', '1', '2']

const SlippageSettings = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation('common')
  const slippage = mangoStore((s) => s.swap.slippage)
  const set = mangoStore((s) => s.set)

  const [showCustomSlippageForm, setShowCustomSlippageForm] = useState(false)
  const [inputValue, setInputValue] = useState(slippage.toString())

  const handleSetSlippage = (slippage: string) => {
    set((s) => {
      s.swap.slippage = parseFloat(slippage)
    })
  }

  useEffect(() => {
    if (!slippagePresets.includes(slippage.toString())) {
      setShowCustomSlippageForm(true)
    }
  }, [])

  return (
    <>
      <h3 className="mb-3">{t('swap:slippage')}</h3>
      <IconButton
        className="absolute right-2 top-2 text-th-fgd-3"
        onClick={onClose}
        hideBg
      >
        <XMarkIcon className="h-6 w-6" />
      </IconButton>
      <div className="mt-4">
        <div className="mb-2 flex justify-between">
          <p className="text-th-fgd-2">{`${t('max')} ${t('swap:slippage')}`}</p>
          <LinkButton
            onClick={() => setShowCustomSlippageForm(!showCustomSlippageForm)}
          >
            {showCustomSlippageForm ? 'Preset' : t('settings:custom')}
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
              onClick={() => handleSetSlippage(inputValue)}
            >
              {t('save')}
            </Button>
          </>
        ) : (
          <ButtonGroup
            activeValue={slippage.toString()}
            className="h-10 font-mono"
            onChange={(v) => handleSetSlippage(v)}
            unit="%"
            values={slippagePresets}
          />
        )}
      </div>
    </>
  )
}

export default SlippageSettings
