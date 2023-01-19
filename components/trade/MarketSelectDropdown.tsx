import ChartRangeButtons from '@components/shared/ChartRangeButtons'
import FavoriteMarketButton from '@components/shared/FavoriteMarketButton'
import TabUnderline from '@components/shared/TabUnderline'
import { Popover } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useSelectedMarket from 'hooks/useSelectedMarket'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { DEFAULT_MARKET_NAME } from 'utils/constants'
import MarketLogos from './MarketLogos'

const isTesting = process.env.NEXT_PUBLIC_SHOW_PERPS === 'true'
const TAB_VALUES = isTesting ? ['spot', 'perp'] : ['spot']

const MarketSelectDropdown = () => {
  const { selectedMarket } = useSelectedMarket()
  const serumMarkets = mangoStore((s) => s.serumMarkets)
  const perpMarkets = mangoStore((s) => s.perpMarkets)
  const [activeTab, setActiveTab] = useState('spot')
  const [spotBaseFilter, setSpotBaseFilter] = useState('All')

  const spotBaseTokens: string[] = useMemo(() => {
    if (serumMarkets.length) {
      const baseTokens: string[] = []
      serumMarkets.map((m) => {
        const base = m.name.split('/')[1]
        if (!baseTokens.includes(base)) {
          baseTokens.push(base)
        }
      })
      return baseTokens
    }
    return []
  }, [serumMarkets])

  return (
    <Popover>
      {({ open }) => (
        <div
          className="relative flex flex-col overflow-visible"
          id="trade-step-one"
        >
          <Popover.Button className="default-transition flex h-12 items-center justify-between hover:text-th-active">
            <div className="flex items-center">
              {selectedMarket ? <MarketLogos market={selectedMarket} /> : null}
              <div className="whitespace-nowrap text-xl font-bold text-th-fgd-1 md:text-base">
                {selectedMarket?.name || DEFAULT_MARKET_NAME}
              </div>
            </div>
            <ChevronDownIcon
              className={`${
                open ? 'rotate-180' : 'rotate-360'
              } mt-0.5 ml-2 h-6 w-6 flex-shrink-0 text-th-fgd-2`}
            />
          </Popover.Button>
          <Popover.Panel className="absolute -left-5 top-12 z-40 mr-4 w-screen bg-th-bkg-2 pb-2 pt-4 md:w-72">
            <TabUnderline
              activeValue={activeTab}
              onChange={(v) => setActiveTab(v)}
              small
              values={TAB_VALUES}
            />
            {activeTab === 'spot' ? (
              serumMarkets?.length ? (
                <>
                  <div className="mb-2 w-56 px-4">
                    <ChartRangeButtons
                      activeValue={spotBaseFilter}
                      values={['All', ...spotBaseTokens]}
                      onChange={(v) => setSpotBaseFilter(v)}
                    />
                  </div>
                  {serumMarkets
                    .filter((mkt) => {
                      if (spotBaseFilter === 'All') {
                        return mkt
                      } else {
                        return mkt.name.split('/')[1] === spotBaseFilter
                      }
                    })
                    .map((m) => {
                      return (
                        <div
                          className="flex items-center justify-between py-2 px-4"
                          key={m.publicKey.toString()}
                        >
                          <Link
                            href={{
                              pathname: '/trade',
                              query: { name: m.name },
                            }}
                            shallow={true}
                          >
                            <div className="default-transition flex items-center hover:cursor-pointer hover:text-th-active">
                              <MarketLogos market={m} />
                              <span
                                className={
                                  m.name === selectedMarket?.name
                                    ? 'text-th-active'
                                    : ''
                                }
                              >
                                {m.name}
                              </span>
                            </div>
                          </Link>
                          <FavoriteMarketButton market={m} />
                        </div>
                      )
                    })}
                </>
              ) : null
            ) : null}
            {activeTab === 'perp'
              ? perpMarkets?.length
                ? perpMarkets
                    .filter((m) => m.name !== 'MNGO-PERP' || isTesting)
                    .map((m) => {
                      return (
                        <div
                          className="flex items-center justify-between py-2 px-4"
                          key={m.publicKey.toString()}
                        >
                          <Link
                            href={{
                              pathname: '/trade',
                              query: { name: m.name },
                            }}
                            shallow={true}
                          >
                            <div className="default-transition flex items-center hover:cursor-pointer hover:bg-th-bkg-2">
                              <MarketLogos market={m} />
                              <span
                                className={
                                  m.name === selectedMarket?.name
                                    ? 'text-th-active'
                                    : ''
                                }
                              >
                                {m.name}
                              </span>
                            </div>
                          </Link>
                          <FavoriteMarketButton market={m} />
                        </div>
                      )
                    })
                : null
              : null}
          </Popover.Panel>
        </div>
      )}
    </Popover>
  )
}

export default MarketSelectDropdown
