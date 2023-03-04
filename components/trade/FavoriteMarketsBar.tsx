import { Transition } from '@headlessui/react'
import { StarIcon } from '@heroicons/react/20/solid'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import Link from 'next/link'
import { FAVORITE_MARKETS_KEY } from 'utils/constants'
import MarketLogos from './MarketLogos'

const FavoriteMarketsBar = () => {
  const [favoriteMarkets] = useLocalStorageState(FAVORITE_MARKETS_KEY, [])
  const { selectedMarket } = useSelectedMarket()
  const { group } = useMangoGroup()

  return (
    <Transition
      className="hide-scroll flex items-center space-x-2 overflow-x-auto border-b border-th-bkg-3 bg-th-bkg-2 py-1 px-4 md:space-x-4 md:px-6"
      show={!!favoriteMarkets.length}
      enter="transition-all ease-in duration-200"
      enterFrom="opacity-0 h-0"
      enterTo="opacity-100 h-8"
      leave="transition-all ease-out duration-200"
      leaveFrom="opacity-100 h-8"
      leaveTo="opacity-0 h-0"
    >
      <StarIcon className="h-4 w-4 flex-shrink-0 text-th-fgd-4" />
      {favoriteMarkets.map((mkt: string) => {
        // const change24h = marketsInfo?.find((m) => m.name === mkt)?.change24h
        const isPerp = mkt.includes('PERP')
        let market
        if (isPerp) {
          market = group?.getPerpMarketByName(mkt)
        } else {
          market = group?.getSerum3MarketByName(mkt)
        }
        return (
          <Link href={`/trade?name=${mkt}`} key={mkt} shallow={true}>
            <div
              className={`default-transition flex items-center whitespace-nowrap py-1 text-xs hover:text-th-active hover:opacity-100 ${
                selectedMarket && selectedMarket.name === mkt
                  ? 'text-th-active'
                  : 'text-th-fgd-1 opacity-60'
              }`}
            >
              {market ? <MarketLogos market={market} small /> : null}
              <span className="mb-0 mr-1.5 text-xs">{mkt}</span>
              {/* {change24h ? (
                <div
                  className={`text-xs ${
                    change24h
                      ? change24h >= 0
                        ? 'text-th-up'
                        : 'text-th-down'
                      : 'text-th-fgd-4'
                  }`}
                >
                  {`${(change24h * 100).toFixed(1)}%`}
                </div>
              ) : null} */}
            </div>
          </Link>
        )
      })}
    </Transition>
  )
}

export default FavoriteMarketsBar
