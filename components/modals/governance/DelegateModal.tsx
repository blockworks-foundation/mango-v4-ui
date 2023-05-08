import Modal from '@components/shared/Modal'

type Props = {
  isOpen: boolean
  onClose: () => void
}

const DelegateModal = ({ isOpen, onClose }: Props) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>asdasd</div>
    </Modal>
  )
}

export default DelegateModal
