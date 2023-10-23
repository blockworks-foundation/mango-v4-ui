import { IconButton } from '@components/shared/Button'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { useIsWhiteListed } from 'hooks/useIsWhiteListed'
import useLocalStorageState from 'hooks/useLocalStorageState'
import {
  useCurrentSeason,
  useDistribution,
  useRewardsParams,
} from 'hooks/useRewards'
import Link from 'next/link'
import { useMemo } from 'react'
import { MANGO_MINTS_BANNER_KEY } from 'utils/constants'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const BANNER_WRAPPER_CLASSES =
  'flex flex-wrap items-center justify-center border-b border-th-bkg-3 bg-th-bkg-2 px-10 py-3'

const LINK_TEXT_CLASSES =
  'bg-gradient-to-b from-mango-classic-theme-active to-mango-classic-theme-down bg-clip-text font-bold text-transparent lg:text-base'

const TEXT_CLASSES = 'mr-2 text-center text-th-fgd-1 lg:text-base'

const PromoBanner = () => {
  const [showBanner, setShowBanner] = useLocalStorageState(
    MANGO_MINTS_BANNER_KEY,
    {},
  )
  const { data: isWhiteListed } = useIsWhiteListed()
  const { data: seasonData } = useCurrentSeason()
  const currentSeason = seasonData ? seasonData.season_id : undefined
  const prevSeason = currentSeason ? currentSeason - 1 : undefined
  const { data: distributionDataAndClient } = useDistribution(prevSeason)
  const { showClaim } = useRewardsParams()

  const hasClosedBanner = useMemo(() => {
    if (!seasonData?.season_id) return false
    return seasonData.season_id in showBanner
  }, [seasonData, showBanner])

  const seasonEndsIn = useMemo(() => {
    if (!seasonData?.season_end) return
    return dayjs().to(seasonData.season_end)
  }, [seasonData])

  const claimEndsIn = useMemo(() => {
    if (!distributionDataAndClient?.distribution) return
    const start = distributionDataAndClient.distribution.start.getTime()
    return dayjs().to(
      start + distributionDataAndClient.distribution.duration * 1000,
    )
  }, [distributionDataAndClient])

  return seasonData?.season_id && isWhiteListed ? (
    showClaim ? (
      <BannerContent
        text={`Claiming season ${seasonData.season_id} rewards ends ${
          claimEndsIn || ''
        }.`}
        linkText="Claim Now"
      />
    ) : !hasClosedBanner ? (
      <BannerContent
        text={`Season ${seasonData.season_id} of Mango Mints ends ${
          seasonEndsIn || ''
        }.`}
        linkText="Let's Go"
        onClickLink={() =>
          setShowBanner({ ...showBanner, [seasonData.season_id]: true })
        }
        onClose={() =>
          setShowBanner({ ...showBanner, [seasonData.season_id]: true })
        }
      />
    ) : null
  ) : null
}

export default PromoBanner

const BannerContent = ({
  text,
  linkText,
  onClickLink,
  onClose,
}: {
  text: string
  linkText: string
  onClickLink?: () => void
  onClose?: () => void
}) => {
  return (
    <div className="relative">
      <div className={BANNER_WRAPPER_CLASSES}>
        <p className={TEXT_CLASSES}>{text}</p>
        <Link
          className={LINK_TEXT_CLASSES}
          href="/rewards"
          onClick={onClickLink}
        >
          {linkText}
        </Link>
      </div>
      {onClose ? (
        <IconButton
          className="absolute right-0 top-1/2 -translate-y-1/2 sm:right-2"
          hideBg
          onClick={onClose}
          size="medium"
        >
          <XMarkIcon className="h-5 w-5 text-th-fgd-3" />
        </IconButton>
      ) : null}
    </div>
  )
}
