import useCollateralFeePopupConditions from 'hooks/useCollateralFeePositions'
import Modal from '../shared/Modal'
import Button from '@components/shared/Button'

type WarningProps = {
  isOpen: boolean
}

const CollateralFeeWarningModal = ({ isOpen }: WarningProps) => {
  const { setWasModalOpen, marginPositionBalanceWithBanks } =
    useCollateralFeePopupConditions()
  console.log(marginPositionBalanceWithBanks)
  //current collateral fee can be get from marginPositionBalanceWithBanks
  return (
    <Modal isOpen={isOpen} onClose={() => setWasModalOpen(true)}>
      <h2 className="mb-2 text-center">Warning text</h2>
      <p className="mb-2">text</p>
      <Button
        className="mt-6 w-full"
        onClick={() => {
          setWasModalOpen(true)
        }}
      >
        ok
      </Button>
    </Modal>
  )
}

export default CollateralFeeWarningModal
