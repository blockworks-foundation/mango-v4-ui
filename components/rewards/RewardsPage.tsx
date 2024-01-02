import { useState } from 'react'
import Leaderboards from './Leaderboards'
import { useWallet } from '@solana/wallet-adapter-react'

import { useCurrentSeason, useIsAllClaimed } from 'hooks/useRewards'
import Season from './Season'
import ClaimPage from './Claim'

export const tiers = ['seed', 'mango', 'whale', 'bot']

const RewardsPage = () => {
  const [showLeaderboards, setShowLeaderboards] = useState('')
  const { publicKey } = useWallet()

  const { data: seasonData } = useCurrentSeason()
  const currentSeason = seasonData ? seasonData.season_id : undefined
  const prevSeason = currentSeason ? currentSeason - 1 : undefined
  const { showClaim } = useIsAllClaimed(prevSeason, publicKey)

  return !showLeaderboards ? (
    showClaim ? (
      <ClaimPage />
    ) : (
      <Season setShowLeaderboards={setShowLeaderboards} />
    )
  ) : (
    <Leaderboards
      leaderboard={showLeaderboards}
      goBack={() => setShowLeaderboards('')}
    />
  )
}

export default RewardsPage
