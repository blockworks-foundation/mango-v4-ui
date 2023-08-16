import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as FilledStarIcon } from '@heroicons/react/20/solid'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { FAVORITE_SWAPS_KEY } from 'utils/constants'
import { useMemo } from 'react'
import Tooltip from '@components/shared/Tooltip'
import { useTranslation } from 'react-i18next'

const FavoriteSwapButton = ({
  inputToken,
  outputToken,
}: {
  inputToken: string
  outputToken: string
}) => {
  const { t } = useTranslation('swap')
  const [favoriteSwaps, setFavoriteSwaps] = useLocalStorageState<string[]>(
    FAVORITE_SWAPS_KEY,
    [],
  )

  const swapPair = useMemo(() => {
    return `${inputToken}/${outputToken}`
  }, [inputToken, outputToken])

  const addToFavorites = (pair: string) => {
    const newFavorites = [...favoriteSwaps, pair]
    setFavoriteSwaps(newFavorites)
  }

  const removeFromFavorites = (marketName: string) => {
    setFavoriteSwaps(favoriteSwaps.filter((m: string) => m !== marketName))
  }

  return favoriteSwaps.find((pair: string) => pair === swapPair) ? (
    <Tooltip content={t('swap:tooltip-favorite-swap-remove')}>
      <button
        className="flex items-center justify-center text-th-active focus-visible:text-th-fgd-4 md:hover:text-th-fgd-3"
        onClick={() => removeFromFavorites(swapPair)}
      >
        <FilledStarIcon className="h-5 w-5" />
      </button>
    </Tooltip>
  ) : (
    <Tooltip content={t('swap:tooltip-favorite-swap-add')}>
      <button
        className="flex items-center justify-center text-th-fgd-4 focus-visible:text-th-active md:hover:text-th-active"
        onClick={() => addToFavorites(swapPair)}
      >
        <StarIcon className="h-5 w-5" />
      </button>
    </Tooltip>
  )
}

export default FavoriteSwapButton
