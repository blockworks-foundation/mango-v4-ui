import { CLUSTER } from '@store/mangoStore'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { OPENBOOK_PROGRAM_ID } from '@blockworks-foundation/mango-v4'
import useMangoGroup from 'hooks/useMangoGroup'

type CreateOpenbookMarketModalProps = {
  quoteSymbol: string
  baseSymbol: string
}

const CreateOpenbookMarketModal = ({
  isOpen,
  onClose,
  quoteSymbol,
  baseSymbol,
}: ModalProps & CreateOpenbookMarketModalProps) => {
  const { group } = useMangoGroup()

  const baseMint = group?.banksMapByName.get(baseSymbol)?.length
    ? group.banksMapByName.get(baseSymbol)![0].mint.toBase58()
    : ''
  const quoteMint = group?.banksMapByName.get(quoteSymbol)?.length
    ? group.banksMapByName.get(quoteSymbol)![0].mint.toBase58()
    : ''

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <p>OpenBook Program id: {OPENBOOK_PROGRAM_ID[CLUSTER].toBase58()}</p>
      <p>Base mint: {baseMint}</p>
      <p>Quote mint: {quoteMint}</p>
    </Modal>
  )
}

export default CreateOpenbookMarketModal
