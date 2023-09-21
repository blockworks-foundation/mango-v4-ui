import { Provider } from '@project-serum/anchor'
import { useQuery } from '@tanstack/react-query'
import {
  fetchAccountTier,
  fetchCurrentSeason,
  fetchDistribution,
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
