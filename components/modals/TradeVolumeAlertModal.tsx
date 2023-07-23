import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import Button, { LinkButton } from '../shared/Button'
import { useTranslation } from 'next-i18next'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { SOUND_SETTINGS_KEY, TRADE_VOLUME_ALERT_KEY } from 'utils/constants'
import Label from '@components/forms/Label'
import { useState } from 'react'
import Switch from '@components/forms/Switch'
import { INITIAL_SOUND_SETTINGS } from '@components/settings/SoundSettings'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import { Howl } from 'howler'
import { PlayIcon } from '@heroicons/react/20/solid'

const volumeAlertSound = new Howl({
  src: ['/sounds/trade-buy.mp3'],
  volume: 0.8,
})

export const DEFAULT_VOLUME_ALERT_SETTINGS = { seconds: 30, value: 10000 }

export const INPUT_CLASSES =
  'h-12 w-full rounded-md border border-th-input-border bg-th-input-bkg px-3 font-mono text-base text-th-fgd-1 focus:border-th-fgd-4 focus:outline-none md:hover:border-th-input-border-hover'

const TradeVolumeAlertModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation(['common', 'trade'])
  const [soundSettings, setSoundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS,
  )
  const [alertSettings, setAlertSettings] = useLocalStorageState(
    TRADE_VOLUME_ALERT_KEY,
    DEFAULT_VOLUME_ALERT_SETTINGS,
  )
  const [formValues, setFormValues] = useState(alertSettings)

  const handleSave = () => {
    setAlertSettings(formValues)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-2 text-center">{t('trade:volume-alert')}</h2>
      <p className="mb-2 text-center">
        {t('trade:volume-alert-desc')}.{' '}
        <i>Warning: this is an experimental feature.</i>
      </p>
      <LinkButton
        className="mb-4 flex w-full items-center justify-center"
        onClick={() => volumeAlertSound.play()}
      >
        <PlayIcon className="mr-1.5 h-4 w-4" />
        <span>{t('trade:preview-sound')}</span>
      </LinkButton>
      <div className="flex items-center justify-between rounded-md bg-th-bkg-3 p-3">
        <p>{t('trade:activate-volume-alert')}</p>
        <Switch
          className="text-th-fgd-3"
          checked={soundSettings['recent-trades']}
          onChange={() =>
            setSoundSettings({
              ...soundSettings,
              'recent-trades': !soundSettings['recent-trades'],
            })
          }
        />
      </div>
      {soundSettings['recent-trades'] ? (
        <>
          <div className="my-4">
            <Label text={t('trade:interval-seconds')} />
            <NumberFormat
              name="seconds"
              id="seconds"
              inputMode="numeric"
              thousandSeparator=","
              allowNegative={false}
              decimalScale={0}
              isNumericString={true}
              className={INPUT_CLASSES}
              placeholder="e.g. 30"
              value={formValues.seconds}
              onValueChange={(e: NumberFormatValues) =>
                setFormValues({
                  ...formValues,
                  seconds: e.value,
                })
              }
            />
          </div>
          <div className="mb-6">
            <Label text={t('trade:notional-volume')} />
            <NumberFormat
              name="value"
              id="value"
              inputMode="numeric"
              thousandSeparator=","
              allowNegative={false}
              isNumericString={true}
              className={INPUT_CLASSES}
              placeholder="e.g. 10,000"
              value={formValues.value}
              onValueChange={(e: NumberFormatValues) =>
                setFormValues({
                  ...formValues,
                  value: e.value,
                })
              }
            />
          </div>
          <Button
            className="w-full"
            disabled={!formValues.seconds || !formValues.value}
            onClick={handleSave}
            size="large"
          >
            {t('save')}
          </Button>
        </>
      ) : null}
    </Modal>
  )
}

export default TradeVolumeAlertModal
