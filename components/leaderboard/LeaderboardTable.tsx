import MedalIcon from '@components/icons/MedalIcon'
import ProfileImage from '@components/profile/ProfileImage'
import SheenLoader from '@components/shared/SheenLoader'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useViewport } from 'hooks/useViewport'
import { formatCurrencyValue } from 'utils/numbers'
import {
  EquityLeaderboardRes,
  PnlLeaderboardRes,
  isEquityLeaderboard,
  isPnlLeaderboard,
} from './LeaderboardPage'
import ToggleFollowButton from '@components/shared/ToggleFollowButton'

const LeaderboardTable = ({
  data,
  loading,
  type,
}: {
  data: PnlLeaderboardRes[] | EquityLeaderboardRes[]
  loading: boolean
  type: string
}) => {
  return (
    <>
      <div className="space-y-2">
        {data.map((d, i) => (
          <LeaderboardRow
            item={d}
            loading={loading}
            rank={i + 1}
            key={d.mango_account + i}
            type={type}
          />
        ))}
      </div>
    </>
  )
}

export default LeaderboardTable

const LeaderboardRow = ({
  item,
  loading,
  rank,
  type,
}: {
  item: PnlLeaderboardRes | EquityLeaderboardRes
  loading?: boolean
  rank: number
  type: string
}) => {
  const { profile_name, profile_image_url, mango_account, wallet_pk } = item
  const value =
    type === 'pnl' && isPnlLeaderboard(item)
      ? item.pnl
      : isEquityLeaderboard(item)
      ? item.account_equity
      : 0
  const { isTablet } = useViewport()

  return !loading ? (
    <div className="flex">
      <div className="flex flex-1 items-center rounded-l-md border border-r-0 border-th-bkg-3 bg-th-bkg-2 px-3">
        <ToggleFollowButton accountPk={mango_account} />
      </div>
      <a
        className="flex w-full items-center justify-between rounded-md rounded-l-none border border-l-0 border-th-bkg-3 p-3 md:px-4 md:hover:bg-th-bkg-2"
        href={`/?address=${mango_account}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="flex w-full items-center space-x-3">
          <div
            className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              rank < 4 ? '' : 'bg-th-bkg-3'
            }`}
          >
            <p
              className={`relative z-10 font-bold ${
                rank < 4 ? 'text-th-bkg-1' : 'text-th-fgd-3'
              }`}
            >
              {rank}
            </p>
            {rank < 4 ? <MedalIcon className="absolute" rank={rank} /> : null}
          </div>
          <ProfileImage
            imageSize={isTablet ? '32' : '40'}
            imageUrl={profile_image_url}
            placeholderSize={isTablet ? '20' : '24'}
          />
          <div className="flex w-full flex-col items-start sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="capitalize text-th-fgd-2 md:text-base">
                {profile_name || wallet_pk
                  ? wallet_pk?.slice(0, 4) + '...' + wallet_pk?.slice(-4)
                  : 'Unknown'}
              </p>
              <p className="text-xs text-th-fgd-4">
                Acc:{' '}
                {mango_account?.slice(0, 4) + '...' + mango_account?.slice(-4)}
              </p>
            </div>
            <span className="mr-3 mt-1 text-right font-mono sm:mt-0 md:text-base">
              {formatCurrencyValue(value, 2)}
            </span>
          </div>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
      </a>
    </div>
  ) : (
    <SheenLoader className="flex flex-1">
      <div className="h-16 w-full rounded-md bg-th-bkg-2" />
    </SheenLoader>
  )
}
