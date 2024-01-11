import useMangoGroup from 'hooks/useMangoGroup'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import MarketLogos from '@components/trade/MarketLogos'
import mangoStore from '@store/mangoStore'
import PerpMarketDetails from './PerpMarketDetails'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'

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
      <div className="flex h-14 items-center space-x-4 border-b border-th-bkg-3">
        <button
          className="flex h-14 w-14 shrink-0 items-center justify-center border-r border-th-bkg-3 focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2"
          onClick={() =>
            router.push(router.pathname, undefined, { shallow: true })
          }
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex items-center">
          <MarketLogos market={marketDetails} size="large" />
          <span className="text-lg font-bold text-th-fgd-1">
            {marketDetails.name}
          </span>
        </div>
      </div>
      <PerpMarketDetails marketStats={marketStats} perpMarket={marketDetails} />
    </>
  ) : null
}

export default PerpStatsPage
