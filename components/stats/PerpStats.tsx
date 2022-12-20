// import { useTranslation } from "next-i18next"
import { useState } from 'react'
import PerpMarketDetails from './PerpMarketDetails'

const PerpStats = () => {
  // const {t} = useTranslation('common')
  const [
    showPerpDetails,
    // setShowPerpDetails
  ] = useState('')
  return !showPerpDetails ? (
    <div />
  ) : (
    <PerpMarketDetails perpMarket={showPerpDetails} />
  )
}

export default PerpStats
