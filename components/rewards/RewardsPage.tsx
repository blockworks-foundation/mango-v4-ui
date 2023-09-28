import { useEffect, useState } from 'react'
import Leaderboards from './Leaderboards'
import { useWallet } from '@solana/wallet-adapter-react'

import {
  useCurrentSeason,
  useDistribution,
  useIsAllClaimed,
} from 'hooks/useRewards'
import Season from './Season'
import ClaimPage from './Claim'

export const tiers = ['seed', 'mango', 'whale', 'bot']

const RewardsPage = () => {
  //   const { t } = useTranslation(['common', 'rewards'])
  const [showClaim, setShowClaim] = useState(false)
  const [showLeaderboards, setShowLeaderboards] = useState('')
  const { publicKey } = useWallet()

  const { data: seasonData } = useCurrentSeason()
  const currentSeason = seasonData ? seasonData.season_id : undefined
  const prevSeason = currentSeason ? currentSeason - 1 : undefined
  const isAllClaimed = useIsAllClaimed(prevSeason, publicKey)
  const { data: distributionDataAndClient } = useDistribution(prevSeason)
  const distributionData = distributionDataAndClient?.distribution

  useEffect(() => {
    if (distributionData && publicKey) {
      const start = distributionData.start.getTime()
      const currentTimestamp = new Date().getTime()
      const isClaimActive =
        start < currentTimestamp &&
        start + distributionData.duration * 1000 > currentTimestamp &&
        !isAllClaimed

      setShowClaim(isClaimActive)
    } else {
      setShowClaim(false)
    }
  }, [distributionData, publicKey, isAllClaimed])

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
