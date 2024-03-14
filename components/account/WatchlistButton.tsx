import useLocalStorageState from 'hooks/useLocalStorageState'
import { StarIcon as FilledStarIcon } from '@heroicons/react/20/solid'
import { StarIcon } from '@heroicons/react/24/outline'
import { WatchlistItem } from './WatchlistTable'

const WatchlistButton = ({
  asset,
  className,
}: {
  asset: WatchlistItem
  className?: string
}) => {
  const [watchlist, setWatchlist] = useLocalStorageState('watchlist-0.1', [])

  const toggleWatchlist = (asset: WatchlistItem) => {
    const isWatched = watchlist.find(
      (item: WatchlistItem) => item.assetName === asset.assetName,
    )
    if (isWatched) {
      const newWatchlist = watchlist.filter(
        (item: WatchlistItem) => item.assetName !== asset.assetName,
      )
      setWatchlist(newWatchlist)
    } else {
      setWatchlist([...watchlist, asset])
    }
  }

  return (
    <button
      className={`flex items-center focus:outline-none disabled:opacity-50 md:hover:text-th-fgd-3 ${className}`}
      // disabled={disabled}
      onClick={() => toggleWatchlist(asset)}
    >
      {watchlist.find(
        (item: WatchlistItem) => item.assetName === asset.assetName,
      ) ? (
        <FilledStarIcon className="h-5 w-5 text-th-active" />
      ) : (
        <StarIcon className="h-5 w-5 text-th-fgd-3" />
      )}
    </button>
  )
}

export default WatchlistButton
