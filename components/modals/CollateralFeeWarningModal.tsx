import useCollateralFeePopupConditions from 'hooks/useCollateralFeePositions'
import Modal from '../shared/Modal'
import Button from '@components/shared/Button'
import { Bank } from '@blockworks-foundation/mango-v4'

type WarningProps = {
  callBack?: () => void
  isOpen: boolean
  bank?: Bank
}

const CollateralFeeWarningModal = ({ isOpen, callBack }: WarningProps) => {
  const { setWasModalOpen } = useCollateralFeePopupConditions()

  return (
    <Modal isOpen={isOpen} onClose={() => null}>
      <h2 className="mb-2 text-center">Warning text</h2>
      <p className="mb-2">text</p>
      <Button
        className="mt-6 w-full"
        onClick={() => {
          setWasModalOpen(true)
          callBack ? callBack() : null
        }}
      >
        ok
      </Button>
    </Modal>
  )
}

export default CollateralFeeWarningModal
