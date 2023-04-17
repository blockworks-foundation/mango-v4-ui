import useMangoGroup from 'hooks/useMangoGroup'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import MarketLogos from '@components/trade/MarketLogos'
import mangoStore from '@store/mangoStore'
import PerpMarketDetails from './PerpMarketDetails'

const PerpStatsPage = () => {
  const router = useRouter()
  const { market } = router.query
  const { group } = useMangoGroup()
  const perpStats = mangoStore((s) => s.perpStats.data)

  useEffect(() => {
    if (!perpStats || !perpStats.length) {
      const actions = mangoStore.getState().actions
      actions.fetchPerpStats()
    }
  }, [perpStats])

  const marketDetails = useMemo(() => {
    if (!group || !market) return
    return group.getPerpMarketByName(market.toString().toUpperCase())
  }, [group, market])

  const marketStats = useMemo(() => {
    if (!marketDetails || !perpStats || !perpStats.length) return []
    const marketStats = perpStats
      .filter((stat) => stat.market_index === marketDetails.perpMarketIndex)
      .reverse()
    return marketStats
  }, [marketDetails, perpStats])

  return marketDetails ? (
    <>
      <div className="flex flex-col border-b border-th-bkg-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center">
            <MarketLogos market={marketDetails} size="large" />
            <h1 className="text-xl">{marketDetails.name}</h1>
          </div>
        </div>
      </div>
      <PerpMarketDetails marketStats={marketStats} perpMarket={marketDetails} />
    </>
  ) : null
}

export default PerpStatsPage
