import { BookSide, PerpMarket } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import useSelectedMarket from 'hooks/useSelectedMarket'

const PerpFundingRate = () => {
  const { selectedMarket } = useSelectedMarket()
  const bids = mangoStore((s) => s.selectedMarket.bidsAccount)
  const asks = mangoStore((s) => s.selectedMarket.asksAccount)

  return (
    <div className="font-mono text-xs text-th-fgd-2">
      {selectedMarket instanceof PerpMarket &&
      bids instanceof BookSide &&
      asks instanceof BookSide
        ? selectedMarket.getCurrentFundingRate(bids, asks)
        : '-'}
    </div>
  )
}

export default PerpFundingRate
