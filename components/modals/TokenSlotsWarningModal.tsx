import { useMemo } from 'react'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'
import Button, { LinkButton } from '@components/shared/Button'
import TopBarStore from '@store/topBarStore'

export enum WARNING_LEVEL {
  NEARLY_FULL,
  FULL,
}

type TokenSlotsWarningModalProps = {
  warningLevel: WARNING_LEVEL
}

type ModalCombinedProps = TokenSlotsWarningModalProps & ModalProps

const TokenSlotsWarningModal = ({
  isOpen,
  onClose,
  warningLevel,
}: ModalCombinedProps) => {
  const { t } = useTranslation(['common', 'account'])
  const { setShowSettingsModal } = TopBarStore()

  const warningHeading = useMemo(() => {
    if (warningLevel === WARNING_LEVEL.NEARLY_FULL) {
      return t('account:token-slots-nearly-full')
    } else return t('account:token-slots-full')
  }, [warningLevel])

  const handleOpenSettings = () => {
    setShowSettingsModal(true)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-2 text-center">{warningHeading}</h2>
      <p className="mb-2">{t('account:token-slots-warning-desc')}</p>
      <p>{t('account:token-slots-manage')}</p>
      <p className="mb-2 font-bold text-th-fgd-2">
        {t('account:slots-settings-path')}
      </p>
      <p>{t('account:slots-open-account')}</p>
      <Button className="mt-6 w-full" onClick={handleOpenSettings}>
        {t('account:open-settings')}
      </Button>
      <LinkButton className="mx-auto mt-3" onClick={onClose}>
        {t('dismiss')}
      </LinkButton>
    </Modal>
  )
}

export default TokenSlotsWarningModal
