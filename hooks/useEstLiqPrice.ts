import mangoStore from '@store/mangoStore'
import { useEffect, useState } from 'react'
import useOpenPerpPositions from './useOpenPerpPositions'
import useInterval from '@components/shared/useInterval'

export type LiqPrice = {
  marketIndex: number
  liqPrice: number
}

const useEstLiqPrice = () => {
  const openPerpPositions = useOpenPerpPositions()
  const [liqPrices, setLiqPrices] = useState<LiqPrice[]>([])

  const getLiqPrices = () => {
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!group || !mangoAccount || !openPerpPositions.length) return
    const liqPrices = []
    for (const position of openPerpPositions) {
      const { marketIndex } = position
      try {
        const liqPrice =
          position.getLiquidationPriceUi(group, mangoAccount) || 0
        if (liqPrice) {
          liqPrices.push({
            marketIndex,
            liqPrice,
          })
        } else {
          liqPrices.push({ marketIndex, liqPrice })
        }
      } catch {
        liqPrices.push({ marketIndex, liqPrice: 0 })
      }
    }
    setLiqPrices(liqPrices)
  }

  useEffect(() => {
    if (openPerpPositions.length && !liqPrices.length) {
      getLiqPrices()
    }
  }, [openPerpPositions, liqPrices])

  useInterval(() => {
    getLiqPrices()
  }, 60 * 1000)

  return liqPrices
}

export default useEstLiqPrice
