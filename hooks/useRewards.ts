import { Provider } from '@project-serum/anchor'
import { Wallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchAccountTier,
  fetchCurrentSeason,
  fetchDistribution,
  fetchLeaderboard,
  fetchRewardsPoints,
} from 'apis/rewards'

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
export const useDistribution = (
  provider: Provider,
  seasonId: number | undefined,
) => {
  return useQuery(
    ['distribution', seasonId],
    () => fetchDistribution(provider, seasonId!),
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
      enabled: !!wallet?.adapter && !!mangoAccountAddress,
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
