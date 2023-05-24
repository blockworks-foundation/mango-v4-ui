import { CLUSTER } from '@store/mangoStore'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { OPENBOOK_PROGRAM_ID } from '@blockworks-foundation/mango-v4'
import useMangoGroup from 'hooks/useMangoGroup'
import { useMemo } from 'react'
import { calculateTradingParameters } from 'utils/governance/listingTools'

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

  const baseBank = group?.banksMapByName.get(baseSymbol)?.length
    ? group.banksMapByName.get(baseSymbol)![0]
    : null
  const quoteBank = group?.banksMapByName.get(quoteSymbol)?.length
    ? group.banksMapByName.get(quoteSymbol)![0]
    : null

  const tradingParams = useMemo(() => {
    if (baseBank && quoteBank) {
      return calculateTradingParameters(
        baseBank.uiPrice,
        quoteBank.uiPrice,
        baseBank.mintDecimals,
        quoteBank.mintDecimals
      )
    }
    return {
      minOrder: 0,
      priceTick: 0,
      baseLotSize: 0,
    }
  }, [baseBank, quoteBank])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <p>OpenBook Program id: {OPENBOOK_PROGRAM_ID[CLUSTER].toBase58()}</p>
      <p>Base mint: {baseBank?.mint.toBase58()}</p>
      <p>Quote mint: {quoteBank?.mint.toBase58()}</p>
      <p>Minimum order size: {tradingParams.minOrder} </p>
      <p>Minimum price tick size: {tradingParams.priceTick} </p>
    </Modal>
  )
}

export default CreateOpenbookMarketModal
