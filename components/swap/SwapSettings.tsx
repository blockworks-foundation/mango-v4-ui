import { XMarkIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import mangoStore from '@store/mangoStore'
import ButtonGroup from '../forms/ButtonGroup'
import Input from '../forms/Input'
import Switch from '../forms/Switch'
import { IconButton } from '../shared/Button'

const slippagePresets = ['0.1', '0.5', '1', '2']

const SwapSettings = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation('common')
  const margin = mangoStore((s) => s.swap.margin)
  const slippage = mangoStore((s) => s.swap.slippage)
  const set = mangoStore((s) => s.set)

  const [showCustomSlippageForm, setShowCustomSlippageForm] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleSetMargin = () => {
    set((s) => {
      s.swap.margin = !s.swap.margin
    })
  }

  const handleSetSlippage = (slippage: string) => {
    set((s) => {
      s.swap.slippage = parseFloat(slippage)
    })
  }

  return (
    <>
      <h3 className="mb-3">{t('settings')}</h3>
      <IconButton className="absolute top-2 right-2" onClick={onClose} hideBg>
        <XMarkIcon className="h-6 w-6" />
      </IconButton>

      <div className="mt-4">
        <p className="mb-2 text-th-fgd-1">{t('swap:slippage')}</p>
        {showCustomSlippageForm ? (
          <Input
            type="text"
            placeholder="0.00"
            value={inputValue}
            onChange={(e: any) => setInputValue(e.target.value)}
            suffix="%"
          />
        ) : (
          <ButtonGroup
            activeValue={slippage.toString()}
            className="h-10"
            onChange={(v) => handleSetSlippage(v)}
            unit="%"
            values={slippagePresets}
          />
        )}
      </div>
      <div className="mt-6 flex items-center justify-between rounded-md bg-th-bkg-2 p-3">
        <p className="text-th-fgd-1">{t('swap:use-margin')}</p>
        <Switch
          className="text-th-fgd-3"
          checked={margin}
          onChange={handleSetMargin}
        />
      </div>
    </>
  )
}

export default SwapSettings
