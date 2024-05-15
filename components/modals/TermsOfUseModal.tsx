import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'
import Button from '@components/shared/Button'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'

const TermsOfUseModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('common')

  return (
    <Modal isOpen={isOpen} onClose={onClose} disableOutsideClose hideClose>
      <>
        <h2 className="mb-2 text-center">{t('accept-terms')}</h2>
        <p className="mb-6 flex flex-wrap justify-center">
          <span className="mr-1">{t('accept-terms-desc')}</span>
          <a
            className="flex items-center"
            href="https://docs.mango.markets/legal/terms-of-use"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('terms-of-use')}
            <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4 shrink-0" />
          </a>
          <span className="mx-1">and</span>
          <a
            className="flex items-center"
            href="https://docs.mango.markets/mango-markets/risks"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('risks')}
            <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4 shrink-0" />
          </a>
        </p>
        <Button className="w-full" onClick={onClose} size="large">
          {t('agree-and-continue')}
        </Button>
      </>
    </Modal>
  )
}

export default TermsOfUseModal
