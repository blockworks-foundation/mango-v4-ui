import MedalIcon from '@components/icons/MedalIcon'
import ProfileImage from '@components/profile/ProfileImage'
import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import { Badge, tiers } from './RewardsPage'
import { useState } from 'react'
import Select from '@components/forms/Select'
import { IconButton } from '@components/shared/Button'
import AcornIcon from '@components/icons/AcornIcon'
import WhaleIcon from '@components/icons/WhaleIcon'
import RobotIcon from '@components/icons/RobotIcon'
import MangoIcon from '@components/icons/MangoIcon'

const Leaderboards = ({
  goBack,
  leaderboard,
}: {
  goBack: () => void
  leaderboard: string
}) => {
  const [topAccountsTier, setTopAccountsTier] = useState<string>(leaderboard)
  const renderTierIcon = (tier: string) => {
    if (tier === 'Bot') {
      return <RobotIcon className="mr-2 h-5 w-5" />
    } else if (tier === 'Mango') {
      return <MangoIcon className="mr-2 h-5 w-5" />
    } else if (tier === 'Whale') {
      return <WhaleIcon className="mr-2 h-5 w-5" />
    } else return <AcornIcon className="mr-2 h-5 w-5" />
  }
  return (
    <div className="mx-auto max-w-[1140px] flex-col items-center p-8 lg:p-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <IconButton className="mr-2" hideBg onClick={goBack} size="small">
            <ArrowLeftIcon className="h-5 w-5" />
          </IconButton>
          <h2 className="mr-4">Leaderboard</h2>
          <Badge
            label="Season 1"
            borderColor="var(--active)"
            shadowColor="var(--active)"
          />
        </div>
        <Select
          className="w-32"
          icon={renderTierIcon(topAccountsTier)}
          value={topAccountsTier}
          onChange={(tier) => setTopAccountsTier(tier)}
        >
          {tiers.map((tier) => (
            <Select.Option key={tier} value={tier}>
              <div className="flex w-full items-center">
                {renderTierIcon(tier)}
                {tier}
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((x, i) => (
          <LeaderboardCard rank={i + 1} key={i} />
        ))}
      </div>
    </div>
  )
}

export default Leaderboards

const LeaderboardCard = ({ rank }: { rank: number }) => {
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  return (
    <a
      className="flex w-full items-center justify-between rounded-md border border-th-bkg-3 px-3 py-3 md:px-4 md:hover:bg-th-bkg-2"
      href={`/?address=${'account'}`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className="flex items-center space-x-3">
        <div
          className={`relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
            rank < 4 ? '' : 'bg-th-bkg-3'
          } md:mr-2`}
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
          imageSize={isMobile ? '32' : '40'}
          imageUrl={''}
          placeholderSize={isMobile ? '20' : '24'}
        />
        <div className="text-left">
          <p className="capitalize text-th-fgd-2 md:text-base">
            {'Bb5tu'.slice(0, 4) + '...' + 'Jkt8u'.slice(-4)}
          </p>
          <p className="text-xs text-th-fgd-4">
            Acc: {'A1at5'.slice(0, 4) + '...' + 'tt45eU'.slice(-4)}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        <span className="mr-3 text-right font-mono md:text-base">{'100'}</span>
        <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
      </div>
    </a>
  )
}
