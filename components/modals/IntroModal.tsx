import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'

const IntroModal = ({ isOpen, onClose }: ModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>Hi</div>
    </Modal>
  )
}

export default IntroModal
