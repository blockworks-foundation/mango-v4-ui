import mangoStore from '@store/mangoStore'
import useMangoGroup from './useMangoGroup'

const useUnsettledPerpPositions = () => {
  const { group } = useMangoGroup()
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)

  return perpPositions.filter((p) => {
    const market = group?.getPerpMarketByMarketIndex(p.marketIndex)
    if (!market || !group) return false
    return p.getUnsettledPnlUi(group, market) !== 0
  })
}

export default useUnsettledPerpPositions
