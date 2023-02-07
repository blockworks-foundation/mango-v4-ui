import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import useMangoAccount from './useMangoAccount'

const useOpenPerpPositions = () => {
  const { mangoAccountAddress } = useMangoAccount()
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)

  const openPositions = useMemo(() => {
    if (!mangoAccountAddress) return []
    return Object.values(perpPositions).filter((p) =>
      p.basePositionLots.toNumber()
    )
  }, [mangoAccountAddress])

  return openPositions
}

export default useOpenPerpPositions
