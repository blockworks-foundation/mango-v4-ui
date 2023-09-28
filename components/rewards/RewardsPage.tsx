import Button from '@components/shared/Button'
// import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import Leaderboards from './Leaderboards'
import { useWallet } from '@solana/wallet-adapter-react'

import {
  useCurrentSeason,
  useDistribution,
  useIsAllClaimed,
} from 'hooks/useRewards'
import Season from './Season'
import Badge from './Badge'
import ClaimPage from './Claim'

export const tiers = ['seed', 'mango', 'whale', 'bot']

const RewardsPage = () => {
  //   const { t } = useTranslation(['common', 'rewards'])
  const [showClaim, setShowClaim] = useState(false)
  const [showLeaderboards, setShowLeaderboards] = useState('')

  const faqRef = useRef<HTMLDivElement>(null)
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

  const scrollToFaqs = () => {
    if (faqRef.current) {
      faqRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start', // or 'end' or 'center'
      })
    }
  }

  return !showLeaderboards ? (
    showClaim ? (
      <ClaimPage />
    ) : (
      <>
        <div className="bg-[url('/images/rewards/madlad-tile.png')]">
          <div className="mx-auto flex max-w-[1140px] flex-col items-center p-8 lg:flex-row lg:p-10">
            <div className="mb-6 h-[180px] w-[180px] flex-shrink-0 lg:mb-0 lg:mr-10 lg:h-[220px] lg:w-[220px]">
              <Image
                className="rounded-lg shadow-lg"
                priority
                src="/images/rewards/madlad.png"
                width={260}
                height={260}
                alt="Top Prize"
              />
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <Badge
                label={`Season ${seasonData?.season_id}`}
                fillColor="bg-th-active"
              />
              <h1 className="my-2 text-center text-4xl lg:text-left">
                Win amazing prizes every week.
              </h1>
              <p className="mb-4 text-center text-lg leading-snug lg:text-left">
                Earn points by performing actions on Mango. More points equals
                more chances to win.
              </p>
              <Button size="large" onClick={scrollToFaqs}>
                How it Works
              </Button>
            </div>
          </div>
        </div>
        <Season faqRef={faqRef} setShowLeaderboards={setShowLeaderboards} />
      </>
    )
  ) : (
    <Leaderboards
      leaderboard={showLeaderboards}
      goBack={() => setShowLeaderboards('')}
    />
  )
}

export default RewardsPage
