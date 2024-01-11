import Select from '@components/forms/Select'
import AcornIcon from '@components/icons/AcornIcon'
import MangoIcon from '@components/icons/MangoIcon'
import RobotIcon from '@components/icons/RobotIcon'
import WhaleIcon from '@components/icons/WhaleIcon'
import SheenLoader from '@components/shared/SheenLoader'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import useMangoAccount from 'hooks/useMangoAccount'
import {
  useCurrentSeason,
  useAccountTier,
  useTopAccountsLeaderBoard,
  useAccountPointsAndRank,
} from 'hooks/useRewards'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { abbreviateAddress } from 'utils/formatting'
import { tiers } from './RewardsPage'
import RewardsTierCard from './RewardsTierCard'
import Faqs from './Faqs'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)
import MedalIcon from '@components/icons/MedalIcon'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { usePlausible } from 'next-plausible'
import { TelemetryEvents } from 'utils/telemetry'
import { useQuery } from '@tanstack/react-query'
import { MANGO_DATA_API_URL } from 'utils/constants'
import {
  ActivityFeed,
  isSpotTradeActivityFeedItem,
  isSwapActivityFeedItem,
} from 'types'
import Tooltip from '@components/shared/Tooltip'
import { useHiddenMangoAccounts } from 'hooks/useHiddenMangoAccounts'

const fetchSeasonTradesData = async (
  startDate: string,
  mangoAccountPk: string,
) => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/stats/activity-feed?mango-account=${mangoAccountPk}&start-date=${startDate}`,
    )
    const parsedResponse = await response.json()

    if (parsedResponse && parsedResponse?.length) {
      const swapsAndSpot = parsedResponse.filter(
        (data: ActivityFeed) =>
          data.activity_type === 'swap' ||
          data.activity_type === 'openbook_trade',
      )
      return swapsAndSpot
    } else return []
  } catch (e) {
    console.error('Failed to load season trades data', e)
    return []
  }
}

const Season = ({
  setShowLeaderboards,
}: {
  setShowLeaderboards: (x: string) => void
}) => {
  const { t } = useTranslation(['common', 'governance', 'rewards'])
  const { hiddenAccounts } = useHiddenMangoAccounts()
  const telemetry = usePlausible<TelemetryEvents>()
  const { wallet } = useWallet()
  const faqRef = useRef<HTMLDivElement>(null)
  const { mangoAccountAddress } = useMangoAccount()
  const [topAccountsTier, setTopAccountsTier] = useState('')
  const { data: seasonData, isInitialLoading: loadingSeasonData } =
    useCurrentSeason()
  const { data: accountTier, isInitialLoading: loadingAccountTier } =
    useAccountTier(mangoAccountAddress, seasonData?.season_id)
  const {
    data: accountPointsAndRank,
    isInitialLoading: loadingAccountPointsAndRank,
    refetch,
  } = useAccountPointsAndRank(mangoAccountAddress, seasonData?.season_id)

  const { data: seasonTradesData } = useQuery(
    ['season-trades-data', seasonData?.season_start],
    () => fetchSeasonTradesData(seasonData!.season_start, mangoAccountAddress),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!(seasonData?.season_start && mangoAccountAddress),
    },
  )

  const averageTradeValue = useMemo(() => {
    if (!seasonTradesData || !seasonTradesData?.length) return 0
    const notionalValues = []
    for (const trade of seasonTradesData) {
      const { activity_details } = trade
      if (isSwapActivityFeedItem(trade)) {
        const value =
          activity_details.swap_in_amount * activity_details.swap_in_price_usd
        notionalValues.push(value)
      }
      if (isSpotTradeActivityFeedItem(trade)) {
        const value = activity_details.size * activity_details.price
        notionalValues.push(value)
      }
    }
    const totalValue = notionalValues.reduce((a, c) => a + c, 0)
    const averageValue = totalValue / notionalValues.length
    return averageValue
  }, [seasonTradesData])

  const projectedTier = useMemo(() => {
    if (!accountTier?.tier) return ''
    if (accountTier.tier === 'bot') {
      return 'bot'
    } else if (averageTradeValue > 1000) {
      return 'whale'
    } else return 'mango'
  }, [accountTier, averageTradeValue])

  useEffect(() => {
    if (!topAccountsTier && !loadingAccountTier) {
      setTopAccountsTier(accountTier?.tier.toLowerCase() || 'mango')
    }
  }, [loadingAccountTier, topAccountsTier])

  const seasonEndsIn = useMemo(() => {
    if (!seasonData?.season_end) return
    return dayjs().to(seasonData.season_end)
  }, [seasonData])

  const {
    data: topAccountsLeaderboardData,
    isFetching: fetchingTopAccountsLeaderboardData,
    isLoading: loadingTopAccountsLeaderboardData,
  } = useTopAccountsLeaderBoard(seasonData?.season_id)

  const leadersForTier = useMemo(() => {
    if (!topAccountsLeaderboardData || !topAccountsLeaderboardData.length)
      return []
    const data =
      topAccountsLeaderboardData.find((x) => x.tier === topAccountsTier)
        ?.leaderboard || []
    if (hiddenAccounts) {
      return data.filter((d) => !hiddenAccounts.includes(d.mango_account))
    } else {
      return data
    }
  }, [topAccountsLeaderboardData, topAccountsTier, hiddenAccounts])

  const isLoadingLeaderboardData =
    fetchingTopAccountsLeaderboardData || loadingTopAccountsLeaderboardData

  useEffect(() => {
    if (mangoAccountAddress) {
      refetch()
    }
  }, [mangoAccountAddress])

  const scrollToFaqs = () => {
    if (faqRef.current) {
      faqRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start', // or 'end' or 'center'
      })
    }
  }

  return (
    <>
      <div className="banner-wrapper relative mx-auto mb-6 flex flex-col items-center justify-center border-b border-th-bkg-3 p-8 lg:mb-8 lg:px-10 lg:py-12">
        <div className="absolute left-0 top-0 mt-3 h-[64px] w-[200%] animate-[moveRightLeft_240s_linear_infinite] bg-[url('/images/rewards/mints-banner-bg-1.png')] bg-contain bg-center bg-repeat-x opacity-30" />
        <div className="absolute bottom-0 right-0 mb-3 h-[64px] w-[200%] animate-[moveLeftRight_300s_linear_infinite] bg-[url('/images/rewards/mints-banner-bg-2.png')] bg-contain bg-center bg-repeat-x opacity-30" />
        <div className="relative">
          <div className="flex items-center justify-center pb-6">
            <div className="flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-red-400 px-4 py-1">
              <div className="flex items-center font-rewards text-lg text-black">
                Season {seasonData?.season_id} ends
                <span className="ml-1">
                  {seasonEndsIn ? (
                    seasonEndsIn
                  ) : loadingSeasonData ? (
                    <SheenLoader className="mb-0.5 ml-1">
                      <div className="h-5 w-12 bg-th-bkg-2" />
                    </SheenLoader>
                  ) : (
                    '–'
                  )}
                </span>
              </div>
            </div>
          </div>
          <h1 className="my-2 text-center font-rewards text-5xl lg:text-6xl">
            Trade. Win. Repeat.
          </h1>
          <p className="mb-6 max-w-2xl text-center text-base leading-snug text-th-fgd-2 lg:text-xl">
            Earn rewards every week by trading on Mango. More points equals more
            chances to win big.
          </p>
          <button
            className="raised-button group mx-auto block h-12 px-6 pt-1 font-rewards text-xl after:rounded-lg focus:outline-none lg:h-14"
            onClick={scrollToFaqs}
          >
            <span className="block text-th-fgd-1 group-hover:mt-1 group-active:mt-2">
              How it Works
            </span>
          </button>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1140px] grid-cols-12 gap-4 p-8 pt-0 lg:p-10 lg:pt-0">
        <div className="order-2 col-span-12 lg:order-1 lg:col-span-7">
          <div className="mb-4 rounded-2xl border border-th-bkg-3 p-6 pb-0">
            <h2 className="rewards-h2 mb-4">Rewards Tiers</h2>
            <div className="mb-6 space-y-2">
              <RewardsTierCard
                icon={<AcornIcon className="h-8 w-8 text-th-fgd-1" />}
                name="seed"
                desc="All new participants start here"
                setShowLeaderboards={setShowLeaderboards}
                status={accountTier?.tier === 'seed' ? 'Your Tier' : ''}
              />
              <RewardsTierCard
                icon={<MangoIcon className="h-8 w-8 text-th-fgd-1" />}
                name="mango"
                desc="Average swap/trade value less than $1,000"
                setShowLeaderboards={setShowLeaderboards}
                status={accountTier?.tier === 'mango' ? 'Your Tier' : ''}
              />
              <RewardsTierCard
                icon={<WhaleIcon className="h-8 w-8 text-th-fgd-1" />}
                name="whale"
                desc="Average swap/trade value greater than $1,000"
                setShowLeaderboards={setShowLeaderboards}
                status={accountTier?.tier === 'whale' ? 'Your Tier' : ''}
              />
              <RewardsTierCard
                icon={<RobotIcon className="h-8 w-8 text-th-fgd-1" />}
                name="bot"
                desc="All bots"
                setShowLeaderboards={setShowLeaderboards}
                status={accountTier?.tier === 'bot' ? 'Your Tier' : ''}
              />
            </div>
          </div>
          <div ref={faqRef}>
            <Faqs />
          </div>
        </div>
        <div className="order-1 col-span-12 lg:order-2 lg:col-span-5">
          <div className="mb-4 rounded-2xl border border-th-bkg-3 p-6">
            <h2 className="rewards-h2 mb-4">Your Points</h2>
            <div className="mb-4 flex h-14 w-full items-center rounded-xl bg-th-bkg-2 px-3">
              {!loadingAccountPointsAndRank ? (
                accountPointsAndRank?.total_points ? (
                  <span className="-mb-1 w-full font-rewards text-5xl text-th-fgd-1">
                    <FormatNumericValue
                      value={accountPointsAndRank.total_points}
                      decimals={0}
                      roundUp
                    />
                  </span>
                ) : wallet?.adapter.publicKey ? (
                  <span className="-mb-1 w-full font-rewards text-5xl text-th-fgd-1">
                    0
                  </span>
                ) : (
                  <span className="flex items-center justify-center text-center font-body text-sm text-th-fgd-3">
                    {t('governance:connect-wallet')}
                  </span>
                )
              ) : (
                <SheenLoader>
                  <div className="h-8 w-32 rounded-md bg-th-bkg-3" />
                </SheenLoader>
              )}
            </div>
            <div className="border-b border-th-bkg-3">
              <div className="flex items-center justify-between border-t border-th-bkg-3 px-3 py-2">
                <p className="rewards-p">Points Earned</p>
                <div className="font-rewards text-lg text-th-active">
                  {!loadingAccountPointsAndRank ? (
                    accountPointsAndRank?.total_points_pre_multiplier ? (
                      <FormatNumericValue
                        value={accountPointsAndRank.total_points_pre_multiplier}
                        decimals={0}
                        roundUp
                      />
                    ) : wallet?.adapter.publicKey ? (
                      0
                    ) : (
                      '–'
                    )
                  ) : (
                    <SheenLoader>
                      <div className="h-4 w-12 rounded-sm bg-th-bkg-3" />
                    </SheenLoader>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-th-bkg-3 px-3 py-2">
                <p className="rewards-p">Streak Bonus</p>
                <p className="font-rewards text-lg text-th-active">
                  {accountTier?.streak_multiplier_percent}%
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-th-bkg-3 px-3 py-2">
                <p className="rewards-p">Current Season Tier</p>
                <div className="font-rewards text-lg text-th-active">
                  {!loadingAccountTier ? (
                    accountTier?.tier ? (
                      <span className="capitalize">{accountTier.tier}</span>
                    ) : (
                      '–'
                    )
                  ) : (
                    <SheenLoader>
                      <div className="h-4 w-12 rounded-sm bg-th-bkg-3" />
                    </SheenLoader>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-th-bkg-3 px-3 py-2">
                <p className="rewards-p">Rank</p>
                <div className="font-rewards text-lg text-th-active">
                  {!loadingAccountPointsAndRank ? (
                    accountPointsAndRank?.rank ? (
                      <span className="capitalize">
                        {`${accountPointsAndRank.rank}/${
                          accountPointsAndRank.total_season_accounts || '–'
                        }`}
                      </span>
                    ) : (
                      '–'
                    )
                  ) : (
                    <SheenLoader>
                      <div className="h-4 w-12 rounded-sm bg-th-bkg-3" />
                    </SheenLoader>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mb-4 rounded-2xl border border-th-bkg-3 p-6">
            <h2 className="rewards-h2 mb-4">Activity</h2>
            <div className="border-b border-th-bkg-3">
              <div className="flex items-center justify-between border-t border-th-bkg-3 px-3 py-2">
                <p className="rewards-p">Average Trade Value</p>
                <span className="font-rewards text-lg text-th-active">
                  <FormatNumericValue value={averageTradeValue} isUsd />
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-th-bkg-3 px-3 py-2">
                <Tooltip content="Your projected tier for next season. This is based on your average trade value">
                  <p className="rewards-p tooltip-underline">
                    Next Season Tier
                  </p>
                </Tooltip>
                <span className="font-rewards text-lg text-th-active">
                  {!loadingAccountTier ? (
                    projectedTier ? (
                      <span className="capitalize">{projectedTier}</span>
                    ) : (
                      '–'
                    )
                  ) : (
                    <SheenLoader>
                      <div className="h-4 w-12 rounded-sm bg-th-bkg-3" />
                    </SheenLoader>
                  )}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-th-bkg-3 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="rewards-h2">Top Accounts</h2>
              <Select
                value={t(`rewards:${topAccountsTier}`)}
                onChange={(tier) => setTopAccountsTier(tier)}
              >
                {tiers.map((tier) => (
                  <Select.Option key={tier} value={tier}>
                    <div className="flex w-full items-center justify-between">
                      {t(`rewards:${tier}`)}
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className="mb-6 border-b border-th-bkg-3">
              {!isLoadingLeaderboardData ? (
                leadersForTier && leadersForTier.length ? (
                  leadersForTier.slice(0, 5).map((user, i: number) => {
                    const rank = i + 1
                    return (
                      <div
                        className="flex items-center justify-between border-t border-th-bkg-3 p-3"
                        key={i + user.mango_account}
                      >
                        <div className="flex items-center space-x-2 font-mono">
                          <div
                            className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                              rank < 4 ? '' : 'bg-th-bkg-3'
                            }`}
                          >
                            <p
                              className={`relative z-10 font-rewards text-base ${
                                rank < 4 ? 'text-th-bkg-1' : 'text-th-fgd-1'
                              }`}
                            >
                              {rank}
                            </p>
                            {rank < 4 ? (
                              <MedalIcon className="absolute" rank={rank} />
                            ) : null}
                          </div>
                          <span className="text-th-fgd-3">
                            {user.mango_account !== mangoAccountAddress
                              ? abbreviateAddress(
                                  new PublicKey(user.mango_account),
                                )
                              : 'YOU'}
                          </span>
                        </div>
                        <span className="font-mono text-th-fgd-1">
                          <FormatNumericValue
                            value={user.total_points}
                            decimals={0}
                          />
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex justify-center border-t border-th-bkg-3 py-4">
                    <span className="text-th-fgd-3">
                      Leaderboard not available
                    </span>
                  </div>
                )
              ) : (
                <div className="space-y-0.5">
                  {[...Array(5)].map((x, i) => (
                    <SheenLoader className="flex flex-1" key={i}>
                      <div className="h-10 w-full bg-th-bkg-2" />
                    </SheenLoader>
                  ))}
                </div>
              )}
            </div>
            <button
              className="raised-button group mx-auto block h-10 w-full px-6 pt-1 font-rewards text-xl after:rounded-lg focus:outline-none lg:h-12"
              onClick={() => {
                setShowLeaderboards(topAccountsTier)
                telemetry('rewardsViewLeaderboard')
              }}
            >
              <span className="block text-th-fgd-1 group-hover:mt-1 group-active:mt-2">
                Full Leaderboard
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Season
