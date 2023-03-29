import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { useState } from 'react'
import PerpMarketDetails from './PerpMarketDetails'
import PerpMarketsTable from './PerpMarketsTable'

const PerpStats = () => {
  const [showPerpDetails, setShowPerpDetails] = useState<PerpMarket | null>(
    null
  )
  return !showPerpDetails ? (
    <PerpMarketsTable setShowPerpDetails={setShowPerpDetails} />
  ) : (
    <PerpMarketDetails
      perpMarket={showPerpDetails}
      setShowPerpDetails={setShowPerpDetails}
    />
  )
}

export default PerpStats
