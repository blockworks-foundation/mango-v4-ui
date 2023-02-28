import { PerpMarket } from '@blockworks-foundation/mango-v4'
// import { BookSide, PerpMarket } from '@blockworks-foundation/mango-v4'
// import mangoStore from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useMemo } from 'react'
import { MANGO_DATA_API_URL } from 'utils/constants'

const fetchFundingRate = async (groupPk: string | undefined) => {
  const res = await fetch(
    `${MANGO_DATA_API_URL}/one-hour-funding-rate?mango-group=${groupPk}`
  )
  return await res.json()
}

export const usePerpFundingRate = () => {
  const { group } = useMangoGroup()

  const res = useQuery<
    { market_index: number; funding_rate_hourly: number }[],
    Error
  >(['funding-rate'], () => fetchFundingRate(group?.publicKey?.toString()), {
    cacheTime: 1000 * 60 * 10,
    staleTime: 1000 * 60,
    retry: 3,
    enabled: !!group,
  })

  return Array.isArray(res?.data) ? res : { isSuccess: false, data: null }
}

const PerpFundingRate = () => {
  const { selectedMarket } = useSelectedMarket()
  const rate = usePerpFundingRate()

  // const bids = mangoStore((s) => s.selectedMarket.bidsAccount)
  // const asks = mangoStore((s) => s.selectedMarket.asksAccount)

  const fundingRate = useMemo(() => {
    if (rate.isSuccess && selectedMarket instanceof PerpMarket) {
      const marketRate = rate?.data?.find(
        (r) => r.market_index === selectedMarket.perpMarketIndex
      )
      return marketRate?.funding_rate_hourly
    }
  }, [rate, selectedMarket])

  return (
    <>
      <div className="font-mono text-xs text-th-fgd-2">
        {selectedMarket instanceof PerpMarket && fundingRate ? (
          `${fundingRate.toFixed(4)}%`
        ) : (
          <span className="text-th-fgd-4">-</span>
        )}
      </div>
      {/* <div className="font-mono text-xs text-th-fgd-2">
        {selectedMarket instanceof PerpMarket &&
        bids instanceof BookSide &&
        asks instanceof BookSide
          ? selectedMarket.getCurrentFundingRate(bids, asks)
          : '-'}
      </div> */}
    </>
  )
}

export default PerpFundingRate
