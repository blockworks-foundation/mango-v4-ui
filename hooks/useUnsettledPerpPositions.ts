import mangoStore from '@store/mangoStore'
import useMangoGroup from './useMangoGroup'

const useUnsettledPerpPositions = () => {
  const { group } = useMangoGroup()
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)

  return perpPositions.filter((p) => {
    const market = group?.getPerpMarketByMarketIndex(p.marketIndex)
    if (!market) return false
    return p.getPnl(market).toNumber() > 0
  })
}

export default useUnsettledPerpPositions
