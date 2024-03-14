import { useQuery } from '@tanstack/react-query'
import { fetchTokenStatsData, processTokenStatsData } from 'apis/mngo'
import useMangoGroup from './useMangoGroup'
import { PublicKey } from '@solana/web3.js'

const refetchMs = 24 * 60 * 60 * 1000

export function useTokenStats(mint?: PublicKey) {
  const { group } = useMangoGroup()
  const criteria = mint
    ? [group?.publicKey.toBase58(), mint.toBase58()]
    : [group?.publicKey.toBase58(), 'all']

  return useQuery(
    ['tokenStats', criteria],
    async () => {
      try {
        const rawData = await fetchTokenStatsData(group!, mint)
        const [data, mangoStats] = processTokenStatsData(rawData, group!)
        return {
          data,
          mangoStats,
        }
      } catch (error) {
        return {
          data: [],
          mangoStats: [],
        }
      }
    },
    {
      enabled: !!group && mint ? !!mint : !!'all',
      staleTime: refetchMs,
      retry: 1,
      refetchInterval: refetchMs,
    },
  )
}
