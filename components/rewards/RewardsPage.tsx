import { useWallet } from '@solana/wallet-adapter-react'

import { useCurrentSeason, useIsAllClaimed } from 'hooks/useRewards'
import Season from './Season'
import ClaimPage from './Claim'

export const tiers = ['seed', 'mango', 'whale', 'bot']

const RewardsPage = () => {
  const { publicKey } = useWallet()

  const { data: seasonData } = useCurrentSeason()
  const currentSeason = seasonData ? seasonData.season_id : undefined
  const prevSeason = currentSeason ? currentSeason - 1 : undefined
  const { showClaim } = useIsAllClaimed(prevSeason, publicKey)

  return showClaim ? <ClaimPage /> : <Season />
}

export default RewardsPage
