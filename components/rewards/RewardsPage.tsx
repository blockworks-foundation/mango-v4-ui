import { useState } from 'react'
import Leaderboards from './Leaderboards'

import { useRewardsParams } from 'hooks/useRewards'
import Season from './Season'
import ClaimPage from './Claim'

export const tiers = ['seed', 'mango', 'whale', 'bot']

const RewardsPage = () => {
  const [showLeaderboards, setShowLeaderboards] = useState('')

  const { showClaim } = useRewardsParams()

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
