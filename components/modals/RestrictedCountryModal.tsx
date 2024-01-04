import { SANCTIONED_COUNTRIES } from 'hooks/useIpAddress'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'
import Checkbox from '@components/forms/Checkbox'
import { useState } from 'react'
import Button from '@components/shared/Button'

const RestrictedCountryModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('common')
  const [confirm, setConfirm] = useState(false)

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideClose disableOutsideClose>
      <h2 className="mb-2 text-center">{t('confirm-jurisdiction')}</h2>
      <p className="text-center">{t('confirm-jurisdiction-desc')}</p>
      <div className="thin-scroll my-4 max-h-[300px] overflow-auto rounded-lg bg-th-bkg-2 p-4">
        <ul>
          {SANCTIONED_COUNTRIES.map((country) => (
            <li key={country[0]}>{country[1]}</li>
          ))}
        </ul>
      </div>
      <Checkbox
        checked={confirm}
        onChange={(e) => setConfirm(e.target.checked)}
      >
        <p className="whitespace-normal">
          {t('confirm-non-restricted-jurisdiction')}
        </p>
      </Checkbox>
      <Button
        className="mt-6 w-full"
        disabled={!confirm}
        onClick={onClose}
        size="large"
      >
        {t('confirm')}
      </Button>
    </Modal>
  )
}

export default RestrictedCountryModal
