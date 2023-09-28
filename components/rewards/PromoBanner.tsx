import { IconButton } from '@components/shared/Button'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { useIsWhiteListed } from 'hooks/useIsWhiteListed'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useCurrentSeason } from 'hooks/useRewards'
import Link from 'next/link'
import { useMemo } from 'react'
import { MANGO_MINTS_BANNER_KEY } from 'utils/constants'

const PromoBanner = () => {
  const [showBanner, setShowBanner] = useLocalStorageState(
    MANGO_MINTS_BANNER_KEY,
    {},
  )
  const { data: isWhiteListed } = useIsWhiteListed()
  const { data: seasonData } = useCurrentSeason()

  const hasClosedBanner = useMemo(() => {
    if (!seasonData?.season_id) return false
    return seasonData.season_id in showBanner
  }, [seasonData, showBanner])

  return isWhiteListed && seasonData?.season_id && !hasClosedBanner ? (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-center border-b border-th-bkg-3 bg-th-bkg-2 px-10 py-3">
        <p className="mr-2  text-center text-th-fgd-1 lg:text-base">
          Season {seasonData.season_id} of Mango Mints is currently running.
        </p>
        <Link
          className="bg-gradient-to-b from-mango-classic-theme-active to-mango-classic-theme-down bg-clip-text font-bold text-transparent lg:text-base"
          href="/rewards"
          onClick={() =>
            setShowBanner({ ...showBanner, [seasonData.season_id]: true })
          }
        >
          Let&apos;s Go
        </Link>
      </div>
      <IconButton
        className="absolute right-0 top-1/2 -translate-y-1/2 sm:right-2"
        hideBg
        onClick={() =>
          setShowBanner({ ...showBanner, [seasonData.season_id]: true })
        }
        size="medium"
      >
        <XMarkIcon className="h-5 w-5 text-th-fgd-3" />
      </IconButton>
    </div>
  ) : null
}

export default PromoBanner
