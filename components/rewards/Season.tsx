import Select from '@components/forms/Select'
import AcornIcon from '@components/icons/AcornIcon'
import MangoIcon from '@components/icons/MangoIcon'
import RobotIcon from '@components/icons/RobotIcon'
import WhaleIcon from '@components/icons/WhaleIcon'
import Button from '@components/shared/Button'
import SheenLoader from '@components/shared/SheenLoader'
import { ClockIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useIsWhiteListed } from 'hooks/useIsWhiteListed'
import useMangoAccount from 'hooks/useMangoAccount'
import {
  useCurrentSeason,
  useAccountTier,
  useWalletPoints,
  useTopAccountsLeaderBoard,
} from 'hooks/useRewards'
import { RefObject, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { abbreviateAddress } from 'utils/formatting'
import { formatNumericValue } from 'utils/numbers'
import { tiers } from './RewardsPage'
import RewardsTierCard from './RewardsTierCard'
import Faqs from './Faqs'
import Badge from './Badge'

const Season = ({
  faqRef,
  setShowLeaderboards,
}: {
  faqRef: RefObject<HTMLDivElement>
  setShowLeaderboards: (x: string) => void
}) => {
  const { t } = useTranslation(['common', 'rewards'])
  const { wallet } = useWallet()
  const [topAccountsTier, setTopAccountsTier] = useState('whale')
  const { mangoAccountAddress } = useMangoAccount()
  const { data: isWhiteListed } = useIsWhiteListed()
  const { data: seasonData } = useCurrentSeason()
  const { data: accountTier } = useAccountTier(
    mangoAccountAddress,
    seasonData?.season_id,
  )
  const {
    data: walletPoints,
    isFetching: fetchingWalletRewardsData,
    isLoading: loadingWalletRewardsData,
    refetch,
  } = useWalletPoints(mangoAccountAddress, seasonData?.season_id, wallet)

  const {
    data: topAccountsLeaderboardData,
    isFetching: fetchingTopAccountsLeaderboardData,
    isLoading: loadingTopAccountsLeaderboardData,
  } = useTopAccountsLeaderBoard(seasonData?.season_id)

  const leadersForTier =
    topAccountsLeaderboardData?.find((x) => x.tier === topAccountsTier)
      ?.leaderboard || []

  const isLoadingWalletData =
    fetchingWalletRewardsData || loadingWalletRewardsData

  const isLoadingLeaderboardData =
    fetchingTopAccountsLeaderboardData || loadingTopAccountsLeaderboardData

  useEffect(() => {
    if (mangoAccountAddress) {
      refetch()
    }
  }, [mangoAccountAddress])

  return (
    <>
      <div className="flex items-center justify-center bg-th-bkg-3 px-4 py-3">
        <ClockIcon className="mr-2 h-5 w-5 text-th-active" />
        <p className="text-base text-th-fgd-2">
          Season 1 starts in:{' '}
          <span className="mr-4 font-bold text-th-fgd-1">4 days</span>
        </p>
      </div>
      <div className="mx-auto grid max-w-[1140px] grid-cols-12 gap-4 p-8 lg:gap-6 lg:p-10">
        <div className="col-span-12 lg:col-span-8">
          <div className="mb-2 rounded-lg border border-th-bkg-3 p-4">
            <h2 className="mb-4">Rewards Tiers</h2>
            <div className="mb-6 space-y-2">
              <RewardsTierCard
                icon={<AcornIcon className="h-8 w-8 text-th-fgd-2" />}
                name="seed"
                desc="All new participants start here"
                setShowLeaderboards={setShowLeaderboards}
                status={
                  accountTier?.mango_account === 'seed' ? 'Qualified' : ''
                }
              />
              <RewardsTierCard
                icon={<MangoIcon className="h-8 w-8 text-th-fgd-2" />}
                name="mango"
                desc="Average swap/trade value less than $1,000"
                setShowLeaderboards={setShowLeaderboards}
                status={
                  accountTier?.mango_account === 'mango' ? 'Qualified' : ''
                }
              />
              <RewardsTierCard
                icon={<WhaleIcon className="h-8 w-8 text-th-fgd-2" />}
                name="whale"
                desc="Average swap/trade value greater than $1,000"
                setShowLeaderboards={setShowLeaderboards}
                status={
                  accountTier?.mango_account === 'whale' ? 'Qualified' : ''
                }
              />
              <RewardsTierCard
                icon={<RobotIcon className="h-8 w-8 text-th-fgd-2" />}
                name="bot"
                desc="All bots"
                setShowLeaderboards={setShowLeaderboards}
                status={accountTier?.mango_account === 'bot' ? 'Qualified' : ''}
              />
            </div>
          </div>
          <div ref={faqRef}>
            <Faqs />
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <div className="mb-2 rounded-lg border border-th-bkg-3 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2>Your Points</h2>
              {isWhiteListed ? (
                <Badge
                  label="Whitelisted"
                  borderColor="var(--success)"
                  shadowColor="var(--success)"
                />
              ) : null}
            </div>
            <div className="mb-4 flex h-14 w-full items-center rounded-md bg-th-bkg-2 px-3">
              <span className="w-full font-display text-3xl text-th-fgd-1">
                {!isLoadingWalletData ? (
                  walletPoints ? (
                    formatNumericValue(walletPoints)
                  ) : wallet?.adapter.publicKey ? (
                    0
                  ) : (
                    <span className="flex items-center justify-center text-center font-body text-sm text-th-fgd-3">
                      {t('connect-wallet')}
                    </span>
                  )
                ) : (
                  <SheenLoader>
                    <div className="h-8 w-32 rounded-md bg-th-bkg-3" />
                  </SheenLoader>
                )}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Points Earned</p>
                <p className="font-mono text-th-fgd-2">
                  {!isLoadingWalletData ? (
                    walletPoints ? (
                      formatNumericValue(walletPoints)
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
                </p>
              </div>
              <div className="flex justify-between">
                <p>Streak Bonus</p>
                <p className="font-mono text-th-fgd-2">0x</p>
              </div>
              <div className="flex justify-between">
                <p>Rewards Tier</p>
                <p className="text-th-fgd-2">
                  {!isLoadingWalletData ? (
                    accountTier?.mango_account ? (
                      <span className="capitalize">
                        {accountTier?.mango_account}
                      </span>
                    ) : (
                      '–'
                    )
                  ) : (
                    <SheenLoader>
                      <div className="h-4 w-12 rounded-sm bg-th-bkg-3" />
                    </SheenLoader>
                  )}
                </p>
              </div>
              <div className="flex justify-between">
                <p>Rank</p>
                <p className="text-th-fgd-2">–</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-th-bkg-3 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="">Top Accounts</h2>
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
            <div className="border-b border-th-bkg-3">
              {!isLoadingLeaderboardData ? (
                leadersForTier && leadersForTier.length ? (
                  leadersForTier.slice(0, 5).map((user, i: number) => (
                    <div
                      className="flex items-center justify-between border-t border-th-bkg-3 p-3"
                      key={i + user.mango_account}
                    >
                      <div className="flex items-center space-x-2 font-mono">
                        <span>{i + 1}.</span>
                        <span className="text-th-fgd-3">
                          {abbreviateAddress(new PublicKey(user.mango_account))}
                        </span>
                      </div>
                      <span className="font-mono text-th-fgd-1">
                        {formatNumericValue(user.total_points, 0)}
                      </span>
                    </div>
                  ))
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
            <Button
              className="mt-6 w-full"
              onClick={() => setShowLeaderboards(topAccountsTier)}
              secondary
            >
              Full Leaderboard
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Season
