import { useMemo } from 'react'
import useMangoGroup from './useMangoGroup'

export default function useBanks() {
  const { group } = useMangoGroup()

  const banks = useMemo(() => {
    if (!group) return []
    return Array.from(group.banksMapByMint)
      .map(([_mintAddress, banks]) => banks)
      .map((b) => b[0])
  }, [group])

  return { banks }
}
