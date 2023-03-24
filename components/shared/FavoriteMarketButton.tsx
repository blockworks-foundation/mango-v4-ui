import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as FilledStarIcon } from '@heroicons/react/20/solid'
import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { FAVORITE_MARKETS_KEY } from 'utils/constants'

const FavoriteMarketButton = ({
  market,
}: {
  market: PerpMarket | Serum3Market
}) => {
  const [favoriteMarkets, setFavoriteMarkets] = useLocalStorageState<string[]>(
    FAVORITE_MARKETS_KEY,
    []
  )

  const addToFavorites = (marketName: string) => {
    const newFavorites = [...favoriteMarkets, marketName]
    setFavoriteMarkets(newFavorites)
  }

  const removeFromFavorites = (marketName: string) => {
    setFavoriteMarkets(favoriteMarkets.filter((m: string) => m !== marketName))
  }

  return favoriteMarkets.find(
    (marketName: string) => marketName === market.name
  ) ? (
    <button
      className="default-transition flex items-center justify-center text-th-active focus:text-th-fgd-4 focus:ring-0 md:hover:text-th-fgd-3"
      onClick={() => removeFromFavorites(market.name)}
    >
      <FilledStarIcon className="h-5 w-5" />
    </button>
  ) : (
    <button
      className="default-transition flex items-center justify-center text-th-fgd-4 focus:text-th-active focus:ring-0 md:hover:text-th-active"
      onClick={() => addToFavorites(market.name)}
    >
      <StarIcon className="h-5 w-5" />
    </button>
  )
}

export default FavoriteMarketButton
