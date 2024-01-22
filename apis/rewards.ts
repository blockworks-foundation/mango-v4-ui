import { MangoMintsRedemptionClient } from '@blockworks-foundation/mango-mints-redemption'
import { Provider } from '@project-serum/anchor'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { AnchorProvider } from '@coral-xyz/anchor'

export const DISTRIBUTION_NUMBER_PREFIX = 118

type AccountTier = {
  mango_account: string
  streak_multiplier_percent: number
  tier: string
}

type AccountPointsAndRank = {
  mango_account: string
  rank: number
  total_points: number
  total_points_pre_multiplier: number
  total_season_accounts: number
}

type CurrentSeason = {
  season_end: string
  season_id: number
  season_start: string
}

type LeaderboardItem = {
  leaderboard: {
    mango_account: string
    tier: string
    total_points: number
  }[]
  tier: string
}

export const fetchDistribution = async (provider: Provider, season: number) => {
  try {
    const client = new MangoMintsRedemptionClient(provider as AnchorProvider)
    const d = await client.loadDistribution(
      parseInt(`${DISTRIBUTION_NUMBER_PREFIX}${season}`),
    )
    return { distribution: d, client }
  } catch (e) {
    console.log(e)
    return { distribution: undefined, client: undefined }
  }
}

export const fetchLeaderboard = async (
  seasonId: number,
): Promise<LeaderboardItem[] | undefined> => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/seasons/season-leaderboard?season-id=${seasonId}`,
    )
    const res = await data.json()
    return res
  } catch (e) {
    console.log('Failed to top accounts leaderboard', e)
  }
}

export const fetchCurrentSeason = async (): Promise<
  CurrentSeason | undefined
> => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/seasons/season-id?timestamp=${new Date().toISOString()}`,
    )
    const res = await data.json()
    return res
  } catch (e) {
    console.log('Failed to load current season', e)
  }
}

export const fetchAccountTier = async (
  mangoAccount: string,
  seasonId: number,
): Promise<AccountTier | undefined> => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/seasons/season-account-tier?mango-account=${mangoAccount}&seasons-id=${seasonId}`,
    )
    const res = await data.json()
    return res
  } catch (e) {
    console.log('Failed to load current season', e)
  }
}

export const fetchAccountPointsAndRank = async (
  mangoAccount: string,
  seasonId: number,
): Promise<AccountPointsAndRank | undefined> => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/seasons/season-leaderboard-position?mango-account=${mangoAccount}&seasons-id=${seasonId}`,
    )
    const res = await data.json()
    return res
  } catch (e) {
    console.log('Failed to load current season', e)
  }
}
