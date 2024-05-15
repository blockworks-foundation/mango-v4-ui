import MedalIcon from '@components/icons/MedalIcon'
import ProfileImage from '@components/profile/ProfileImage'
import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { useViewport } from 'hooks/useViewport'
import { useEffect, useMemo, useState } from 'react'
import Select from '@components/forms/Select'
import { IconButton } from '@components/shared/Button'
import AcornIcon from '@components/icons/AcornIcon'
import WhaleIcon from '@components/icons/WhaleIcon'
import RobotIcon from '@components/icons/RobotIcon'
import MangoIcon from '@components/icons/MangoIcon'
import { useQuery } from '@tanstack/react-query'
import SheenLoader from '@components/shared/SheenLoader'
import { abbreviateAddress } from 'utils/formatting'
import { PublicKey } from '@solana/web3.js'
import { useTranslation } from 'next-i18next'
import { fetchLeaderboard } from 'apis/rewards'
import {
  useAccountPointsAndRank,
  useAccountTier,
  useCurrentSeason,
} from 'hooks/useRewards'
import Badge from './Badge'
import { tiers } from './RewardsPage'
import useMangoAccount from 'hooks/useMangoAccount'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { useHiddenMangoAccounts } from 'hooks/useHiddenMangoAccounts'

const Leaderboards = ({
  goBack,
  leaderboard,
}: {
  goBack: () => void
  leaderboard: string
}) => {
  const { t } = useTranslation('rewards')
  const { isDesktop } = useViewport()
  const { mangoAccountAddress } = useMangoAccount()
  const { hiddenAccounts } = useHiddenMangoAccounts()
  const [leaderboardToShow, setLeaderboardToShow] =
    useState<string>(leaderboard)
  const renderTierIcon = (tier: string) => {
    if (tier === 'bot') {
      return <RobotIcon className="mr-2 h-5 w-5" />
    } else if (tier === 'mango') {
      return <MangoIcon className="mr-2 h-5 w-5" />
    } else if (tier === 'whale') {
      return <WhaleIcon className="mr-2 h-5 w-5" />
    } else return <AcornIcon className="mr-2 h-5 w-5" />
  }
  const { data: seasonData } = useCurrentSeason()
  const { data: accountTier } = useAccountTier(
    mangoAccountAddress,
    seasonData?.season_id,
  )
  const { data: accountPointsAndRank } = useAccountPointsAndRank(
    mangoAccountAddress,
    seasonData?.season_id,
  )

  const { data: leaderboardData, isLoading: loadingLeaderboardData } = useQuery(
    ['rewards-leaderboard-data', leaderboardToShow],
    () => fetchLeaderboard(seasonData!.season_id),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!seasonData,
    },
  )

  const leadersForTier = useMemo(() => {
    if (!leaderboardData || !leaderboardData.length) return []
    const data =
      leaderboardData.find((x) => x.tier === leaderboardToShow)?.leaderboard ||
      []
    if (hiddenAccounts) {
      return data.filter((d) => !hiddenAccounts.includes(d.mango_account))
    } else {
      return data
    }
  }, [leaderboardData, leaderboardToShow, hiddenAccounts])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }, [])

  const isInTop20 = useMemo(() => {
    if (!leadersForTier.length || !mangoAccountAddress) return true
    return !!leadersForTier.find(
      (leader) => leader.mango_account === mangoAccountAddress,
    )
  }, [leadersForTier, mangoAccountAddress])

  return (
    <div className="mx-auto min-h-screen max-w-[1140px] flex-col items-center p-8 lg:p-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <IconButton className="mr-2" hideBg onClick={goBack} size="small">
            <ArrowLeftIcon className="h-5 w-5" />
          </IconButton>
          <h2 className="rewards-h2 mr-4">Leaderboard</h2>
          <Badge
            label={`Season ${seasonData?.season_id}`}
            fillColor="bg-th-active"
          />
        </div>
        <Select
          className="w-32"
          icon={renderTierIcon(leaderboardToShow)}
          value={t(leaderboardToShow)}
          onChange={(tier) => setLeaderboardToShow(tier)}
        >
          {tiers.map((tier) => (
            <Select.Option key={tier} value={tier}>
              <div className="flex w-full items-center">
                {renderTierIcon(tier)}
                {t(tier)}
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        {accountTier?.tier === leaderboardToShow &&
        accountPointsAndRank?.rank &&
        !isInTop20 ? (
          <div className="flex w-full items-center justify-between rounded-lg border border-th-active p-3 md:rounded-xl md:p-4">
            <div className="flex items-center space-x-3">
              <div
                className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  accountPointsAndRank.rank < 4 ? '' : 'bg-th-bkg-3'
                } md:mr-2`}
              >
                <p
                  className={`relative z-10 font-rewards text-base ${
                    accountPointsAndRank.rank < 4
                      ? 'text-th-bkg-1'
                      : 'text-th-fgd-1'
                  }`}
                >
                  {accountPointsAndRank.rank}
                </p>
                {accountPointsAndRank.rank < 4 ? (
                  <MedalIcon
                    className="absolute"
                    rank={accountPointsAndRank.rank}
                  />
                ) : null}
              </div>
              <ProfileImage
                imageSize={!isDesktop ? '32' : '40'}
                imageUrl={''}
                placeholderSize={!isDesktop ? '20' : '24'}
              />
              <div className="text-left">
                <p className="text-th-fgd-2 md:text-base">YOU</p>
              </div>
            </div>
            <div>
              <span className="mr-3 text-right font-mono md:text-base">
                <FormatNumericValue
                  value={accountPointsAndRank.total_points}
                  decimals={0}
                  roundUp
                />
              </span>
            </div>
          </div>
        ) : null}
        {!loadingLeaderboardData ? (
          leadersForTier && leadersForTier.length ? (
            leadersForTier.map((acc, i: number) => (
              <LeaderboardCard rank={i + 1} key={i} account={acc} />
            ))
          ) : (
            <div className="flex justify-center rounded-lg border border-th-bkg-3 p-8">
              <span className="text-th-fgd-3">Leaderboard not available</span>
            </div>
          )
        ) : (
          <div className="space-y-2">
            {[...Array(20)].map((x, i) => (
              <SheenLoader className="flex flex-1" key={i}>
                <div className="h-16 w-full bg-th-bkg-2" />
              </SheenLoader>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboards

const LeaderboardCard = ({
  rank,
  account,
}: {
  rank: number
  account: {
    mango_account: string
    tier: string
    total_points: number
  }
}) => {
  const { isDesktop } = useViewport()
  const { mangoAccountAddress } = useMangoAccount()
  const { mango_account, total_points } = account
  return (
    <a
      className={`flex w-full items-center justify-between rounded-lg border p-3 md:rounded-xl md:p-4 md:hover:bg-th-bkg-2 ${
        mango_account === mangoAccountAddress
          ? 'pointer-events-none border-th-active'
          : 'border-th-bkg-3'
      }`}
      href={`/?address=${mango_account}`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className="flex items-center space-x-3">
        <div
          className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            rank < 4 ? '' : 'bg-th-bkg-3'
          } md:mr-2`}
        >
          <p
            className={`relative z-10 font-rewards text-base ${
              rank < 4 ? 'text-th-bkg-1' : 'text-th-fgd-1'
            }`}
          >
            {rank}
          </p>
          {rank < 4 ? <MedalIcon className="absolute" rank={rank} /> : null}
        </div>
        <ProfileImage
          imageSize={!isDesktop ? '32' : '40'}
          imageUrl={''}
          placeholderSize={!isDesktop ? '20' : '24'}
        />
        <div className="text-left">
          <p className="capitalize text-th-fgd-2 md:text-base">
            {mango_account !== mangoAccountAddress
              ? abbreviateAddress(new PublicKey(mango_account))
              : 'YOU'}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        <span className="mr-3 text-right font-mono md:text-base">
          <FormatNumericValue value={total_points} decimals={0} />
        </span>
        {mango_account !== mangoAccountAddress ? (
          <ChevronRightIcon className="h-6 w-6 text-th-fgd-3" />
        ) : (
          <div className="h-6 w-6" />
        )}
      </div>
    </a>
  )
}
