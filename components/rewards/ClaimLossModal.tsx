import Button from '@components/shared/Button'
import Modal from '@components/shared/Modal'
import { ModalProps } from 'types/modal'

const ClaimLossModal = ({ isOpen, onClose }: ModalProps) => {
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="mb-6 text-center">
          <h2 className="mb-2">Better luck next time</h2>
          <p className="text-lg">This box is empty</p>
        </div>
        <Button className="w-full" onClick={onClose} size="large">
          Close
        </Button>
      </Modal>
    </>
  )
}

export default ClaimLossModal
