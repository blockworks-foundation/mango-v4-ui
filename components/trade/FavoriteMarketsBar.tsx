import { Transition } from '@headlessui/react'
import { TrashIcon } from '@heroicons/react/20/solid'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import Link from 'next/link'
import { DEFAULT_FAVORITE_MKTS, FAVORITE_MARKETS_KEY } from 'utils/constants'
import MarketLogos from './MarketLogos'

const FavoriteMarketsBar = () => {
  const [favoriteMarkets, setFavorites] = useLocalStorageState(
    FAVORITE_MARKETS_KEY,
    DEFAULT_FAVORITE_MKTS,
  )
  const { selectedMarket } = useSelectedMarket()
  const { group } = useMangoGroup()

  return (
    <Transition
      className="flex items-center justify-between border-b border-th-bkg-3 bg-th-bkg-2 py-1 pl-4"
      show={!!favoriteMarkets.length}
      enter="transition-all ease-in duration-200"
      enterFrom="opacity-0 h-0"
      enterTo="opacity-100 h-8"
      leave="transition-all ease-out duration-200"
      leaveFrom="opacity-100 h-8"
      leaveTo="opacity-0 h-0"
    >
      <div className="hide-scroll flex items-center space-x-2 overflow-x-auto md:space-x-4">
        {favoriteMarkets.map((mkt: string) => {
          const isPerp = mkt.includes('PERP')
          let market
          if (isPerp) {
            market = group?.getPerpMarketByName(mkt)
          } else {
            market = group?.getSerum3MarketByName(mkt)
          }
          return (
            <Link
              className={`flex items-center whitespace-nowrap py-1 text-xs hover:text-th-active hover:opacity-100 focus-visible:text-th-fgd-1 focus-visible:opacity-100 focus-visible:outline-none ${
                selectedMarket && selectedMarket.name === mkt
                  ? 'text-th-active'
                  : 'text-th-fgd-1 opacity-60'
              }`}
              href={`/trade?name=${mkt}`}
              key={mkt}
              shallow={true}
            >
              {market ? <MarketLogos market={market} size="small" /> : null}
              <span className="mb-0 mr-1.5 text-xs">{mkt}</span>
            </Link>
          )
        })}
      </div>
      <button
        onClick={() => setFavorites([])}
        className="cursor-pointer px-4 text-th-fgd-4 focus:outline-none md:hover:text-th-fgd-2"
      >
        <TrashIcon className="h-4 w-4 shrink-0" />
      </button>
    </Transition>
  )
}

export default FavoriteMarketsBar
