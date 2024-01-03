import Slider from '@components/forms/Slider'
import Button, { IconButton, LinkButton } from '@components/shared/Button'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'react-i18next'
import { MAX_ACCOUNTS } from 'utils/constants'

export type ACCOUNT_SLOTS = {
  tokenSlots: number
  serumSlots: number
  perpSlots: number
}

export const DEFAULT_SLOTS: ACCOUNT_SLOTS = {
  tokenSlots: parseInt(MAX_ACCOUNTS.tokenAccounts),
  serumSlots: parseInt(MAX_ACCOUNTS.spotOpenOrders),
  perpSlots: parseInt(MAX_ACCOUNTS.perpAccounts),
}

const CreateAccountAdvancedOptions = ({
  slots,
  setSlots,
  onClose,
}: {
  slots: ACCOUNT_SLOTS
  setSlots: (slots: React.SetStateAction<ACCOUNT_SLOTS> | ACCOUNT_SLOTS) => void
  onClose?: () => void
}) => {
  const { t } = useTranslation(['common', 'settings'])

  const handleResetDefaults = () => {
    setSlots(DEFAULT_SLOTS)
  }

  const calculateMaxValues = () => {
    const maxTotalSlots = 28

    const maxTokenSlots = Math.floor(
      (maxTotalSlots - slots.serumSlots - slots.perpSlots * 2) / 2,
    )
    const maxSerumSlots =
      maxTotalSlots - slots.tokenSlots * 2 - slots.perpSlots * 2
    const maxPerpSlots = Math.floor(
      (maxTotalSlots - slots.tokenSlots * 2 - slots.serumSlots) / 2,
    )

    return {
      maxTokenSlots,
      maxSerumSlots,
      maxPerpSlots,
    }
  }

  const handleSliderChange = (property: keyof ACCOUNT_SLOTS, value: string) => {
    setSlots((prevSlots: ACCOUNT_SLOTS) => ({
      ...prevSlots,
      [property]: parseInt(value),
    }))

    const { maxTokenSlots, maxSerumSlots, maxPerpSlots } = calculateMaxValues()

    // Ensure each property stays within its maximum value
    if (property === 'tokenSlots') {
      setSlots((prevSlots: ACCOUNT_SLOTS) => ({
        ...prevSlots,
        serumSlots: Math.min(prevSlots.serumSlots, maxSerumSlots),
        perpSlots: Math.min(prevSlots.perpSlots, maxPerpSlots),
      }))
    } else if (property === 'serumSlots') {
      setSlots((prevSlots: ACCOUNT_SLOTS) => ({
        ...prevSlots,
        tokenSlots: Math.min(prevSlots.tokenSlots, maxTokenSlots),
        perpSlots: Math.min(prevSlots.perpSlots, maxPerpSlots),
      }))
    } else if (property === 'perpSlots') {
      setSlots((prevSlots: ACCOUNT_SLOTS) => ({
        ...prevSlots,
        tokenSlots: Math.min(prevSlots.tokenSlots, maxTokenSlots),
        serumSlots: Math.min(prevSlots.serumSlots, maxSerumSlots),
      }))
    }
  }

  const { tokenSlots, serumSlots, perpSlots } = slots

  return (
    <div>
      <div className="mb-2 flex items-center">
        {onClose ? (
          <IconButton className="mr-3" onClick={onClose} size="small">
            <ArrowLeftIcon className="h-5 w-5" />
          </IconButton>
        ) : null}
        <h2 className="w-full text-center">{t('account:advanced-options')}</h2>
        {onClose ? <div className="h-5 w-5" /> : null}
      </div>
      <p>{t('account:advanced-options-desc')}</p>
      <div className="mt-4 rounded-md border border-th-bkg-3 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm">{t('settings:account-slots')}</h3>
          <LinkButton onClick={handleResetDefaults}>
            {t('account:reset-defaults')}
          </LinkButton>
        </div>
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <p>{t('tokens')}</p>
            <p className="font-mono text-th-fgd-1">{tokenSlots}</p>
          </div>
          <Slider
            amount={tokenSlots}
            max={calculateMaxValues().maxTokenSlots.toString()}
            min="0"
            onChange={(value) => handleSliderChange('tokenSlots', value)}
            step={1}
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <p>{t('spot-markets')}</p>
            <p className="font-mono text-th-fgd-1">{serumSlots}</p>
          </div>
          <Slider
            amount={serumSlots}
            max={calculateMaxValues().maxSerumSlots.toString()}
            min="0"
            onChange={(value) => handleSliderChange('serumSlots', value)}
            step={1}
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <p>{t('perp-markets')}</p>
            <p className="font-mono text-th-fgd-1">{perpSlots}</p>
          </div>
          <Slider
            amount={perpSlots}
            max={calculateMaxValues().maxPerpSlots.toString()}
            min="0"
            onChange={(value) => handleSliderChange('perpSlots', value)}
            step={1}
          />
        </div>
      </div>
      <Button className="mt-6 w-full" size="large" onClick={onClose}>
        {t('save')}
      </Button>
    </div>
  )
}

export default CreateAccountAdvancedOptions
