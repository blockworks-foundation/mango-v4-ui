import { BookSide, PerpMarket } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useMemo } from 'react'

const fetchFundingRate = async (groupPk: string | undefined) => {
  const res = await fetch(
    `https://mango-transaction-log.herokuapp.com/v4/one-hour-funding-rate?mango-group=${groupPk}`
  )
  return await res.json()
}

export const usePerpFundingRate = () => {
  const { group } = useMangoGroup()

  const res = useQuery<any[], Error>(
    ['funding-rate'],
    () => fetchFundingRate(group?.publicKey?.toString()),
    {
      cacheTime: 1000 * 60,
      staleTime: 1000 * 60,
      retry: true,
      enabled: !!group,
    }
  )

  return res
}

const PerpFundingRate = () => {
  const { selectedMarket } = useSelectedMarket()
  const rate = usePerpFundingRate()
  const bids = mangoStore((s) => s.selectedMarket.bidsAccount)
  const asks = mangoStore((s) => s.selectedMarket.asksAccount)

  const fundingRate = useMemo(() => {
    if (rate.isSuccess && selectedMarket instanceof PerpMarket) {
      const marketRate = rate?.data.find(
        (r) => r.market_index === selectedMarket.perpMarketIndex
      )
      return marketRate?.funding_rate_hourly
    }
  }, [rate])

  return (
    <>
      <div className="font-mono text-xs text-th-fgd-2">
        {selectedMarket instanceof PerpMarket &&
        bids instanceof BookSide &&
        asks instanceof BookSide
          ? fundingRate.toFixed(4)
          : '-'}
        %
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
