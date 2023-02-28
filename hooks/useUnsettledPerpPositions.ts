import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import useMangoAccount from './useMangoAccount'
import useMangoGroup from './useMangoGroup'

const useUnsettledPerpPositions = () => {
  const { group } = useMangoGroup()
  const { mangoAccountAddress } = useMangoAccount()
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)

  const positions = useMemo(() => {
    if (!mangoAccountAddress) return []
    return perpPositions.filter((p) => {
      const market = group?.getPerpMarketByMarketIndex(p.marketIndex)
      if (!market || !group) return false
      return p.getUnsettledPnlUi(market) !== 0
    })
  }, [mangoAccountAddress, perpPositions, group])

  return positions
}

export default useUnsettledPerpPositions
