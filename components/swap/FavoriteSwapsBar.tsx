import { Transition } from '@headlessui/react'
import { StarIcon } from '@heroicons/react/20/solid'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoGroup from 'hooks/useMangoGroup'
import { FAVORITE_SWAPS_KEY } from 'utils/constants'
import { LinkButton } from '@components/shared/Button'
import { Bank } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'

const set = mangoStore.getState().set

const FavoriteSwapsBar = () => {
  const [favoriteSwaps] = useLocalStorageState(FAVORITE_SWAPS_KEY, [])
  const { group } = useMangoGroup()

  const handleFavoriteClick = (
    inputBank: Bank | undefined,
    outputBank: Bank | undefined,
  ) => {
    if (!inputBank || !outputBank) return
    set((state) => {
      state.swap.inputBank = inputBank
      state.swap.outputBank = outputBank
    })
  }

  return (
    <Transition
      className="hide-scroll flex items-center space-x-2 overflow-x-auto border-b border-th-bkg-3 bg-th-bkg-2 px-4 py-1 md:space-x-4 md:px-6"
      show={!!favoriteSwaps.length}
      enter="transition-all ease-in duration-200"
      enterFrom="opacity-0 h-0"
      enterTo="opacity-100 h-8"
      leave="transition-all ease-out duration-200"
      leaveFrom="opacity-100 h-8"
      leaveTo="opacity-0 h-0"
    >
      <StarIcon className="h-4 w-4 shrink-0 text-th-fgd-4" />
      {favoriteSwaps.map((pair: string) => {
        const inputToken = pair.split('/')[0]
        const outputToken = pair.split('/')[1]
        const inputBank = group?.banksMapByName.get(inputToken)?.[0]
        const outputBank = group?.banksMapByName.get(outputToken)?.[0]
        return (
          <LinkButton
            className={`flex items-center whitespace-nowrap py-1 text-xs hover:text-th-active hover:opacity-100 focus-visible:text-th-fgd-1 focus-visible:opacity-100 focus-visible:outline-none`}
            key={pair}
            onClick={() => handleFavoriteClick(inputBank, outputBank)}
          >
            <span className="mb-0 mr-1.5 text-xs">{pair}</span>
          </LinkButton>
        )
      })}
    </Transition>
  )
}

export default FavoriteSwapsBar
