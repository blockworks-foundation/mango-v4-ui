import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as FilledStarIcon } from '@heroicons/react/20/solid'
import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { DEFAULT_FAVORITE_MKTS, FAVORITE_MARKETS_KEY } from 'utils/constants'

const FavoriteMarketButton = ({
  market,
}: {
  market: PerpMarket | Serum3Market
}) => {
  const [favoriteMarkets, setFavoriteMarkets] = useLocalStorageState<string[]>(
    FAVORITE_MARKETS_KEY,
    DEFAULT_FAVORITE_MKTS,
  )

  const addToFavorites = (marketName: string) => {
    const newFavorites = [...favoriteMarkets, marketName]
    setFavoriteMarkets(newFavorites)
  }

  const removeFromFavorites = (marketName: string) => {
    setFavoriteMarkets(favoriteMarkets.filter((m: string) => m !== marketName))
  }

  return favoriteMarkets.find(
    (marketName: string) => marketName === market.name,
  ) ? (
    <button
      className="flex items-center justify-center text-th-active focus-visible:text-th-fgd-4 md:hover:text-th-fgd-3"
      onClick={() => removeFromFavorites(market.name)}
    >
      <FilledStarIcon className="h-4 w-4" />
    </button>
  ) : (
    <button
      className="flex items-center justify-center text-th-fgd-4 focus-visible:text-th-active md:hover:text-th-active"
      onClick={() => addToFavorites(market.name)}
    >
      <StarIcon className="h-4 w-4" />
    </button>
  )
}

export default FavoriteMarketButton
