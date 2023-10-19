import { Wallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import {
  fetchAccountPointsAndRank,
  fetchAccountTier,
  fetchCurrentSeason,
  fetchDistribution,
  fetchLeaderboard,
  fetchRewardsPoints,
} from 'apis/rewards'
import { useEffect, useState } from 'react'

export const useCurrentSeason = () => {
  return useQuery(['current-season-data'], () => fetchCurrentSeason(), {
    cacheTime: 1000 * 60 * 10,
    staleTime: 1000 * 60,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}
export const useAccountTier = (
  mangoAccount: string,
  seasonId: number | undefined,
) => {
  return useQuery(
    ['account-tier', mangoAccount],
    () => fetchAccountTier(mangoAccount, seasonId!),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      enabled: !!mangoAccount && !!seasonId,
    },
  )
}
export const useAccountPointsAndRank = (
  mangoAccount: string,
  seasonId: number | undefined,
) => {
  return useQuery(
    ['account-rank', mangoAccount],
    () => fetchAccountPointsAndRank(mangoAccount, seasonId!),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      enabled: !!mangoAccount && !!seasonId,
    },
  )
}
export const useDistribution = (seasonId: number | undefined) => {
  const { client } = mangoStore()
  const provider = client.program.provider
  return useQuery(
    ['distribution', seasonId],
    () => fetchDistribution(client.program.provider, seasonId!),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      enabled: !!provider && !!seasonId,
    },
  )
}

export const useWalletPoints = (
  mangoAccountAddress: string,
  season_id: number | undefined,
  wallet: Wallet | null,
) => {
  return useQuery(
    ['rewards-points', mangoAccountAddress, season_id],
    () => fetchRewardsPoints(mangoAccountAddress, season_id!),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!(wallet?.adapter && mangoAccountAddress),
    },
  )
}

export const useTopAccountsLeaderBoard = (season_id: number | undefined) => {
  return useQuery(
    ['top-accounts-leaderboard-data'],
    () => fetchLeaderboard(season_id!),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!season_id,
    },
  )
}

export const useIsAllClaimed = (
  prevSeason: number | undefined,
  walletPk: PublicKey | null,
) => {
  const [isAllClaimed, setIsAllCliamed] = useState(true)
  const { data: distributionDataAndClient } = useDistribution(prevSeason)
  const distributionData = distributionDataAndClient?.distribution

  useEffect(() => {
    const handleGetIsAllClaimed = async () => {
      if (walletPk) {
        const toClaim = distributionData?.getClaims(walletPk).length
        const claimed = (await distributionData?.getClaimed(walletPk))?.filter(
          (x) => !x.equals(PublicKey.default),
        )?.length

        setIsAllCliamed(!toClaim || toClaim === claimed)
      } else {
        setIsAllCliamed(false)
      }
    }
    handleGetIsAllClaimed()
  }, [distributionData, walletPk])

  return isAllClaimed
}
