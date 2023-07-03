import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import useMangoAccount from './useMangoAccount'

const useOpenPerpPositions = () => {
  const { mangoAccountAddress } = useMangoAccount()
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)

  const openPositions = useMemo(() => {
    const group = mangoStore.getState().group
    if (!mangoAccountAddress || !group) return []
    return Object.values(perpPositions)
      .filter((p) => p.basePositionLots.toNumber())
      .sort((a, b) => {
        const aMarket = group.getPerpMarketByMarketIndex(a.marketIndex)
        const bMarket = group.getPerpMarketByMarketIndex(b.marketIndex)
        const aBasePosition = a.getBasePositionUi(aMarket)
        const bBasePosition = b.getBasePositionUi(bMarket)
        const aNotional = aBasePosition * aMarket._uiPrice
        const bNotional = bBasePosition * bMarket._uiPrice
        return Math.abs(bNotional) - Math.abs(aNotional)
      })
  }, [mangoAccountAddress, perpPositions])

  return openPositions
}

export default useOpenPerpPositions
