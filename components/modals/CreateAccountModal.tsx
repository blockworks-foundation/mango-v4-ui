import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import CreateAccountForm from '@components/account/CreateAccountForm'
import mangoStore from '@store/mangoStore'

const CreateAccountModal = ({ isOpen, onClose }: ModalProps) => {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex min-h-[264px] flex-col items-center justify-center">
        <CreateAccountForm
          customClose={onClose}
          isFirstAccount={!mangoAccount}
        />
      </div>
    </Modal>
  )
}

export default CreateAccountModal
