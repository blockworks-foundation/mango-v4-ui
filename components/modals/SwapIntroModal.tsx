import Button from '@components/shared/Button'
import { ArrowsRightLeftIcon, CheckCircleIcon } from '@heroicons/react/20/solid'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'

const SwapIntroModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation(['common', 'swap'])
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-th-bkg-3">
          <ArrowsRightLeftIcon className="h-6 w-6 text-th-active" />
        </div>
        <h2>{t('swap:mango-swap')}</h2>
      </div>
      <ul>
        <ListItem desc={t('swap:swap-into-1')} />
        <ListItem desc={t('swap:swap-into-2')} />
        <ListItem desc={t('swap:swap-into-3')} />
        <ListItem desc={t('swap:swap-into-4')} />
      </ul>
      <Button className="mt-6 w-full" onClick={onClose}>
        {t('get-started')}
      </Button>
    </Modal>
  )
}

export default SwapIntroModal

const ListItem = ({ desc }: { desc: string }) => {
  return (
    <li className="mt-3 flex items-start">
      <CheckCircleIcon className="mr-1.5 mt-[1px] h-5 w-5 shrink-0 text-th-up " />
      <span className="text-th-fgd-2 md:text-base md:leading-snug">{desc}</span>
    </li>
  )
}
