// import ChartRangeButtons from '@components/shared/ChartRangeButtons'
import FavoriteMarketButton from '@components/shared/FavoriteMarketButton'
import { Popover } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { useMemo } from 'react'
import { DEFAULT_MARKET_NAME } from 'utils/constants'
import MarketLogos from './MarketLogos'

const MarketSelectDropdown = () => {
  const { t } = useTranslation('common')
  const { selectedMarket } = useSelectedMarket()
  const serumMarkets = mangoStore((s) => s.serumMarkets)
  const allPerpMarkets = mangoStore((s) => s.perpMarkets)
  // const [spotBaseFilter, setSpotBaseFilter] = useState('All')

  const perpMarkets = useMemo(() => {
    return allPerpMarkets
      .filter(
        (p) =>
          p.publicKey.toString() !==
          '9Y8paZ5wUpzLFfQuHz8j2RtPrKsDtHx9sbgFmWb5abCw'
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allPerpMarkets])

  // const spotBaseTokens: string[] = useMemo(() => {
  //   if (serumMarkets.length) {
  //     const baseTokens: string[] = []
  //     serumMarkets.map((m) => {
  //       const base = m.name.split('/')[1]
  //       if (!baseTokens.includes(base)) {
  //         baseTokens.push(base)
  //       }
  //     })
  //     return baseTokens
  //   }
  //   return []
  // }, [serumMarkets])

  return (
    <Popover>
      {({ open, close }) => (
        <div
          className="relative -ml-2 flex flex-col overflow-visible"
          id="trade-step-one"
        >
          <Popover.Button className="default-transition -ml-4 flex h-12 items-center justify-between px-4 hover:text-th-active focus:bg-th-bkg-3">
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
          <Popover.Panel className="absolute -left-4 top-12 z-40 mr-4 w-screen rounded-none bg-th-bkg-2 pb-4 pt-2 md:-left-6 md:w-72 md:rounded-br-md">
            <p className="my-2 ml-4 text-xs md:ml-6">{t('perp')}</p>
            {perpMarkets?.length
              ? perpMarkets.map((m) => {
                  return (
                    <div
                      className="flex items-center justify-between py-2 px-4 md:px-6"
                      key={m.publicKey.toString()}
                      onClick={() => {
                        close()
                      }}
                    >
                      <Link
                        className="default-transition flex items-center hover:cursor-pointer focus:text-th-active focus:outline-none md:hover:text-th-fgd-3"
                        href={{
                          pathname: '/trade',
                          query: { name: m.name },
                        }}
                        shallow={true}
                      >
                        <MarketLogos market={m} />
                        <span>{m.name}</span>
                      </Link>
                      <FavoriteMarketButton market={m} />
                    </div>
                  )
                })
              : null}
            <p className="my-2 ml-4 text-xs md:ml-6">{t('spot')}</p>
            {serumMarkets?.length ? (
              <>
                {serumMarkets
                  .map((x) => x)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((m) => {
                    return (
                      <div
                        className="flex items-center justify-between py-2 px-4 md:px-6"
                        key={m.publicKey.toString()}
                        onClick={() => {
                          close()
                        }}
                      >
                        <Link
                          className="default-transition flex items-center hover:cursor-pointer focus:text-th-active focus:outline-none md:hover:text-th-fgd-3"
                          href={{
                            pathname: '/trade',
                            query: { name: m.name },
                          }}
                          shallow={true}
                        >
                          <MarketLogos market={m} />
                          <span>{m.name}</span>
                        </Link>
                        <FavoriteMarketButton market={m} />
                      </div>
                    )
                  })}
              </>
            ) : null}
          </Popover.Panel>
        </div>
      )}
    </Popover>
  )
}

export default MarketSelectDropdown
