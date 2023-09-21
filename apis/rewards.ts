import { MangoMintsRedemptionClient } from '@blockworks-foundation/mango-mints-redemption'
import { Provider } from '@project-serum/anchor'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { AnchorProvider } from '@coral-xyz/anchor'

export const DISTRIBUTION_NUMBER_PREFIX = 420

export const fetchRewardsPoints = async (
  mangoAccountPk: string,
  seasonId: number,
) => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/seasons/season-total-points-account?mango-account=${mangoAccountPk}&seasons-id=${seasonId}`,
    )
    const res = await data.json()
    return res.total_points
  } catch (e) {
    console.log('Failed to fetch points', e)
  }
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

export const fetchLeaderboard = async (seasonId: number) => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/seasons/season-leaderboard?seasons-id=${seasonId}`,
    )
    const res = (await data.json()) as {
      leaderboard: {
        mango_account: string
        tier: string
        total_points: number
      }[]
      tier: string
    }[]
    return res
  } catch (e) {
    console.log('Failed to top accounts leaderboard', e)
  }
}

export const fetchCurrentSeason = async () => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/seasons/season-id?timestamp=${new Date().toISOString()}`,
    )
    const res = (await data.json()) as {
      season_end: string
      season_id: number
      season_start: string
    }
    return res
  } catch (e) {
    console.log('Failed to load current season', e)
  }
}

export const fetchAccountTier = async (
  mangoAccount: string,
  seasonId: number,
) => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/seasons/season-account-tier?mango-account=${mangoAccount}&seasons-id=${seasonId}`,
    )
    const res = (await data.json()) as { mango_account: string }
    return res
  } catch (e) {
    console.log('Failed to load current season', e)
  }
}
