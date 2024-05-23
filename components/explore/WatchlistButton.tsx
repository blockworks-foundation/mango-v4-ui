import useLocalStorageState from 'hooks/useLocalStorageState'
import { TOKEN_WATCHLIST_KEY } from 'utils/constants'
import PinFill from '@components/icons/PinFill'
import PinOutline from '@components/icons/PinOutline'

export const DEFAULT_WATCHLIST = [4, 0]

const WatchlistButton = ({
  tokenIndex,
  className,
}: {
  tokenIndex: number
  className?: string
}) => {
  const [watchlist, setWatchlist] = useLocalStorageState(
    TOKEN_WATCHLIST_KEY,
    DEFAULT_WATCHLIST,
  )

  const toggleWatchlist = (tokenIndex: number) => {
    const isWatched = watchlist.includes(tokenIndex)
    if (isWatched) {
      const newWatchlist = watchlist.filter(
        (item: number) => item !== tokenIndex,
      )
      setWatchlist(newWatchlist)
    } else {
      setWatchlist([...watchlist, tokenIndex])
    }
  }

  return (
    <button
      className={`flex items-center focus:outline-none disabled:opacity-50 md:hover:text-th-fgd-3 ${className}`}
      onClick={() => toggleWatchlist(tokenIndex)}
    >
      {watchlist.includes(tokenIndex) ? (
        <PinFill className="h-6 w-6 text-th-active" />
      ) : (
        <PinOutline className="h-6 w-6 text-th-fgd-4" />
      )}
    </button>
  )
}

export default WatchlistButton
