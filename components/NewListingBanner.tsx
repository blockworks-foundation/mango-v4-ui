import { XMarkIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoGroup from 'hooks/useMangoGroup'
import Link from 'next/link'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NEW_LISTING_BANNER_KEY } from 'utils/constants'

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

  return (!hasSeenNewListingBanner && showForNewListing) ||
    (showForNewListing && hasSeenNewListingBanner !== latestListing?.name) ? (
    <div className="flex items-center justify-between bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 px-4 py-1">
      <div className="h-5 w-5" />
      <div className="mx-4 flex flex-wrap items-center justify-center font-bold text-black">
        <span className="mx-1.5">
          {t('new-token-live', { tokenName: latestListing.name })}
        </span>
        <div>
          {newMarketName ? (
            <>
              <Link
                className="text-black underline md:hover:text-black md:hover:no-underline"
                href={`/trade?name=${newMarketName}`}
                shallow
              >
                {`${t('trade')} ${latestListing.name}`}
              </Link>{' '}
              <span className="text-[rgba(0,0,0,0.4)]">|</span>{' '}
            </>
          ) : null}
          <Link
            className="text-black underline md:hover:text-black md:hover:no-underline"
            href={`/swap?in=USDC&out=${latestListing.name}`}
            shallow
          >
            {`${t('swap')} ${latestListing.name}`}
          </Link>
        </div>
      </div>
      <button
        className="text-black focus:outline-none"
        onClick={() => setHasSeenNewListingBanner(latestListing.name)}
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  ) : null
}

export default NewListingBanner
