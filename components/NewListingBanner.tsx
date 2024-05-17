import { XMarkIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoGroup from 'hooks/useMangoGroup'
import Link from 'next/link'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NEW_LISTING_BANNER_KEY } from 'utils/constants'
import TokenLogo from './shared/TokenLogo'

const NewListingBanner = () => {
  const { t } = useTranslation('common')
  const [hasSeenNewListingBanner, setHasSeenNewListingBanner] =
    useLocalStorageState(NEW_LISTING_BANNER_KEY, '')
  const { group } = useMangoGroup()
  const serumMarkets = mangoStore((s) => s.serumMarkets)

  const latestListing = useMemo(() => {
    if (!group) return
    const mintInfos = Array.from(group.mintInfosMapByTokenIndex).map(
      ([, mintInfo]) => mintInfo,
    )
    if (mintInfos?.length) {
      const latestInfo = mintInfos.sort((a, b) => {
        return b.registrationTime.toNumber() - a.registrationTime.toNumber()
      })[0]
      const latest = group.getFirstBankByMint(latestInfo.mint)

      return latest
    } else return
  }, [group])

  const newMarketName = useMemo(() => {
    if (!latestListing || !group || !serumMarkets || !serumMarkets?.length)
      return
    const market = serumMarkets.find(
      (mkt) => mkt.baseTokenIndex === latestListing.tokenIndex,
    )
    return market?.name
  }, [group, latestListing, serumMarkets])

  const showForNewListing = latestListing && latestListing.uiPrice

  // change this to false when token launches
  const isPreLaunch = false

  return (!hasSeenNewListingBanner && showForNewListing) ||
    (showForNewListing && hasSeenNewListingBanner !== latestListing?.name) ? (
    <div className="flex items-center justify-between border-b border-th-bkg-3 bg-gradient-to-r from-th-bkg-1 via-th-bkg-2 to-th-bkg-1 px-4 py-2">
      <div className="h-5 w-5" />
      <div className="mx-4 flex flex-wrap items-center justify-center text-th-fgd-1">
        <TokenLogo bank={latestListing} size={16} />
        <span className="mx-1.5">
          {!isPreLaunch
            ? t('new-token-live', { tokenName: latestListing.name })
            : `Pre-launch DRIFT is live.`}
        </span>
        <div>
          {newMarketName ? (
            <>
              <Link
                className="font-bold text-th-fgd-1"
                href={`/trade?name=${newMarketName}`}
                shallow
              >
                {!isPreLaunch
                  ? `${t('trade')} ${latestListing.name}`
                  : 'Place Your Bids'}
              </Link>{' '}
              {!isPreLaunch ? <span className="text-th-fgd-4">|</span> : null}{' '}
            </>
          ) : null}
          {!isPreLaunch ? (
            <Link
              className="font-bold text-th-fgd-1"
              href={`/swap?in=USDC&out=${latestListing.name}`}
              shallow
            >
              {`${t('swap')} ${latestListing.name}`}
            </Link>
          ) : null}
        </div>
      </div>
      <button
        className="text-th-fgd-3 focus:outline-none"
        onClick={() => setHasSeenNewListingBanner(latestListing.name)}
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  ) : null
}

export default NewListingBanner
