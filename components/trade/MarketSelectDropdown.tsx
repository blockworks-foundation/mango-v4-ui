// import ChartRangeButtons from '@components/shared/ChartRangeButtons'
import Change from '@components/shared/Change'
import FavoriteMarketButton from '@components/shared/FavoriteMarketButton'
import SheenLoader from '@components/shared/SheenLoader'
import { getOneDayPerpStats } from '@components/stats/PerpMarketsTable'
import { Popover } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import { useBirdeyeMarketPrices } from 'hooks/useBirdeyeMarketPrices'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { useMemo } from 'react'
import { DEFAULT_MARKET_NAME } from 'utils/constants'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import MarketLogos from './MarketLogos'

const MarketSelectDropdown = () => {
  const { t } = useTranslation('common')
  const { selectedMarket } = useSelectedMarket()
  const serumMarkets = mangoStore((s) => s.serumMarkets)
  const allPerpMarkets = mangoStore((s) => s.perpMarkets)
  const perpStats = mangoStore((s) => s.perpStats.data)
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const { group } = useMangoGroup()
  const { data: birdeyePrices, isLoading: loadingPrices } =
    useBirdeyeMarketPrices()
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
          className="relative flex flex-col overflow-visible md:-ml-2"
          id="trade-step-one"
        >
          <Popover.Button className="-ml-4 flex h-12 items-center justify-between px-4 focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2">
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
          <Popover.Panel className="absolute -left-4 top-12 z-40 mr-4 w-screen rounded-none bg-th-bkg-2 pb-4 pt-2 md:-left-6 md:w-96 md:rounded-br-md">
            <p className="my-2 ml-4 text-xs md:ml-6">{t('perp')}</p>
            {perpMarkets?.length
              ? perpMarkets.map((m) => {
                  const changeData = getOneDayPerpStats(perpStats, m.name)

                  const change = changeData.length
                    ? ((m.uiPrice - changeData[0].price) /
                        changeData[0].price) *
                      100
                    : 0
                  return (
                    <div
                      className="flex items-center justify-between py-2 px-4 md:px-6"
                      key={m.publicKey.toString()}
                      onClick={() => {
                        close()
                      }}
                    >
                      <Link
                        className="flex items-center hover:cursor-pointer focus:outline-none focus-visible:text-th-active md:hover:text-th-fgd-3"
                        href={{
                          pathname: '/trade',
                          query: { name: m.name },
                        }}
                        shallow={true}
                      >
                        <MarketLogos market={m} />
                        <span>{m.name}</span>
                      </Link>
                      <div className="flex items-center space-x-3">
                        {!loadingPerpStats ? (
                          <Change change={change} suffix="%" />
                        ) : (
                          <SheenLoader className="mt-0.5">
                            <div className="h-3.5 w-12 bg-th-bkg-2" />
                          </SheenLoader>
                        )}
                        <FavoriteMarketButton market={m} />
                      </div>
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
                    const birdeyeData = birdeyePrices?.length
                      ? birdeyePrices.find(
                          (market) =>
                            market.mint === m.serumMarketExternal.toString()
                        )
                      : null
                    const baseBank = group?.getFirstBankByTokenIndex(
                      m.baseTokenIndex
                    )
                    const quoteBank = group?.getFirstBankByTokenIndex(
                      m.quoteTokenIndex
                    )
                    const market = group?.getSerum3ExternalMarket(
                      m.serumMarketExternal
                    )
                    let price
                    if (baseBank && market && quoteBank) {
                      price = floorToDecimal(
                        baseBank.uiPrice / quoteBank.uiPrice,
                        getDecimalCount(market.tickSize)
                      ).toNumber()
                    }
                    const change =
                      birdeyeData && price
                        ? ((price - birdeyeData.data[0].value) /
                            birdeyeData.data[0].value) *
                          100
                        : 0
                    return (
                      <div
                        className="flex items-center justify-between py-2 px-4 md:px-6"
                        key={m.publicKey.toString()}
                        onClick={() => {
                          close()
                        }}
                      >
                        <Link
                          className="flex items-center hover:cursor-pointer focus:outline-none focus-visible:text-th-active md:hover:text-th-fgd-3"
                          href={{
                            pathname: '/trade',
                            query: { name: m.name },
                          }}
                          shallow={true}
                        >
                          <MarketLogos market={m} />
                          <span>{m.name}</span>
                        </Link>
                        <div className="flex items-center space-x-3">
                          {!loadingPrices ? (
                            change ? (
                              <Change change={change} suffix="%" />
                            ) : (
                              <span className="text-th-fgd-3">–</span>
                            )
                          ) : (
                            <SheenLoader className="mt-0.5">
                              <div className="h-3.5 w-12 bg-th-bkg-2" />
                            </SheenLoader>
                          )}
                          <FavoriteMarketButton market={m} />
                        </div>
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
