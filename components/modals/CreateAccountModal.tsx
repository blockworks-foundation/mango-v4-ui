import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import CreateAccountForm from '@components/account/CreateAccountForm'
import mangoStore from '@store/mangoStore'
import { useRouter } from 'next/router'

const CreateAccountModal = ({ isOpen, onClose }: ModalProps) => {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const router = useRouter()
  const { asPath } = useRouter()

  const handleClose = () => {
    if (asPath !== '/') {
      router.push('/')
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex min-h-[264px] flex-col items-center justify-center">
        <CreateAccountForm
          customClose={handleClose}
          isFirstAccount={!mangoAccount}
        />
      </div>
    </Modal>
  )
}

export default CreateAccountModal
