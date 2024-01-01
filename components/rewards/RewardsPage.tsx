import { useState } from 'react'
import Leaderboards from './Leaderboards'
import { useWallet } from '@solana/wallet-adapter-react'

import { useCurrentSeason, useIsAllClaimed } from 'hooks/useRewards'
import Season from './Season'
import ClaimPage from './Claim'
import Loading from '@components/shared/Loading'

export const tiers = ['seed', 'mango', 'whale', 'bot']

const RewardsPage = () => {
  const [showLeaderboards, setShowLeaderboards] = useState('')
  const { publicKey } = useWallet()

  const { data: seasonData } = useCurrentSeason()
  const currentSeason = seasonData ? seasonData.season_id : undefined
  const prevSeason = currentSeason ? currentSeason - 1 : undefined
  const { showClaim, loading: loadingShowClaim } = useIsAllClaimed(
    prevSeason,
    publicKey,
  )

  return !showLeaderboards ? (
    loadingShowClaim ? (
      <div className="flex min-h-[calc(100vh-92px)] items-center justify-center">
        <Loading />
      </div>
    ) : showClaim ? (
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
