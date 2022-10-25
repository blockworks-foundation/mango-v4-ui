import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import CreateAccountForm from '@components/account/CreateAccountForm'

const CreateAccountModal = ({ isOpen, onClose }: ModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex min-h-[264px] flex-col items-center justify-center">
        <CreateAccountForm customClose={onClose} />
      </div>
    </Modal>
  )
}

export default CreateAccountModal
