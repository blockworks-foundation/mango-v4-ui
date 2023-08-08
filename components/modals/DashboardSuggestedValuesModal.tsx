import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'

const DashboardSuggestedValues = ({ isOpen, onClose }: ModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex min-h-[264px] flex-col items-center justify-center">
        llol
      </div>
    </Modal>
  )
}

export default DashboardSuggestedValues
