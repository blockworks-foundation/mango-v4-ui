// import ChartRangeButtons from '@components/shared/ChartRangeButtons'
import Change from '@components/shared/Change'
import FavoriteMarketButton from '@components/shared/FavoriteMarketButton'
import SheenLoader from '@components/shared/SheenLoader'
import { getOneDayPerpStats } from '@components/stats/PerpMarketsOverviewTable'
import { Popover } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import { useBirdeyeMarketPrices } from 'hooks/useBirdeyeMarketPrices'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  floorToDecimal,
  formatCurrencyValue,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import MarketLogos from './MarketLogos'
import SoonBadge from '@components/shared/SoonBadge'
import TabButtons from '@components/shared/TabButtons'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
import Loading from '@components/shared/Loading'

const MARKET_LINK_WRAPPER_CLASSES =
  'flex items-center justify-between px-4 md:pl-6 md:pr-4'

const MARKET_LINK_CLASSES =
  'mr-1 -ml-3 flex w-full items-center justify-between rounded-md py-2 px-3 focus:outline-none focus-visible:text-th-active md:hover:cursor-pointer md:hover:bg-th-bkg-3 md:hover:text-th-fgd-1'

const MARKET_LINK_DISABLED_CLASSES =
  'mr-2 -ml-3 flex w-full items-center justify-between rounded-md py-2 px-3 md:hover:cursor-not-allowed'

const MarketSelectDropdown = () => {
  const { t } = useTranslation('common')
  const { selectedMarket } = useSelectedMarket()
  const [spotOrPerp, setSpotOrPerp] = useState(
    selectedMarket instanceof PerpMarket ? 'perp' : 'spot'
  )
  const serumMarkets = mangoStore((s) => s.serumMarkets)
  const allPerpMarkets = mangoStore((s) => s.perpMarkets)
  const perpStats = mangoStore((s) => s.perpStats.data)
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const { group } = useMangoGroup()
  const { data: birdeyePrices, isLoading: loadingPrices } =
    useBirdeyeMarketPrices()
  const [spotBaseFilter, setSpotBaseFilter] = useState('All')

  const perpMarkets = useMemo(() => {
    return allPerpMarkets
      .filter(
        (p) =>
          p.publicKey.toString() !==
          '9Y8paZ5wUpzLFfQuHz8j2RtPrKsDtHx9sbgFmWb5abCw'
      )
      .sort((a, b) =>
        a.oracleLastUpdatedSlot == 0 ? -1 : a.name.localeCompare(b.name)
      )
  }, [allPerpMarkets])

  const spotBaseTokens: string[] = useMemo(() => {
    if (serumMarkets.length) {
      const baseTokens: string[] = ['All']
      serumMarkets.map((m) => {
        const base = m.name.split('/')[1]
        if (!baseTokens.includes(base)) {
          baseTokens.push(base)
        }
      })
      return baseTokens.sort((a, b) => a.localeCompare(b))
    }
    return ['All']
  }, [serumMarkets])

  const serumMarketsToShow = useMemo(() => {
    if (!serumMarkets || !serumMarkets.length) return []
    if (spotBaseFilter !== 'All') {
      return serumMarkets.filter((m) => {
        const base = m.name.split('/')[1]
        return base === spotBaseFilter
      })
    } else {
      return serumMarkets
    }
  }, [serumMarkets, spotBaseFilter])

  return (
    <Popover>
      {({ open, close }) => (
        <div
          className="relative flex flex-col overflow-visible md:-ml-2"
          id="trade-step-one"
        >
          <Popover.Button
            className="-ml-4 flex h-12 items-center justify-between px-4 focus-visible:bg-th-bkg-3 disabled:cursor-not-allowed disabled:opacity-60 md:hover:bg-th-bkg-2 disabled:md:hover:bg-th-bkg-1"
            disabled={!group}
          >
            <div className="flex items-center">
              {selectedMarket ? (
                <MarketLogos market={selectedMarket} />
              ) : (
                <Loading className="mr-2 h-5 w-5 flex-shrink-0" />
              )}
              <div className="whitespace-nowrap text-xl font-bold text-th-fgd-1 md:text-base">
                {selectedMarket?.name || (
                  <span className="text-th-fgd-3">{t('loading')}</span>
                )}
              </div>
            </div>
            <ChevronDownIcon
              className={`${
                open ? 'rotate-180' : 'rotate-360'
              } mt-0.5 ml-2 h-6 w-6 flex-shrink-0 text-th-fgd-2`}
            />
          </Popover.Button>
          <Popover.Panel className="absolute -left-4 top-12 z-40 mr-4 w-screen rounded-none border-y border-r border-th-bkg-3 bg-th-bkg-2 md:-left-6 md:w-[420px] md:rounded-br-md">
            <div className="border-b border-th-bkg-3">
              <TabButtons
                activeValue={spotOrPerp}
                onChange={(v) => setSpotOrPerp(v)}
                values={[
                  ['perp', 0],
                  ['spot', 0],
                ]}
                fillWidth
              />
            </div>
            <div className="py-3">
              {spotOrPerp === 'perp' && perpMarkets?.length
                ? perpMarkets.map((m) => {
                    const changeData = getOneDayPerpStats(perpStats, m.name)
                    const isComingSoon = m.oracleLastUpdatedSlot == 0

                    const change = changeData.length
                      ? ((m.uiPrice - changeData[0].price) /
                          changeData[0].price) *
                        100
                      : 0
                    return (
                      <div
                        className={MARKET_LINK_WRAPPER_CLASSES}
                        key={m.publicKey.toString()}
                      >
                        {!isComingSoon ? (
                          <>
                            <Link
                              className={MARKET_LINK_CLASSES}
                              href={{
                                pathname: '/trade',
                                query: { name: m.name },
                              }}
                              onClick={() => {
                                close()
                              }}
                              shallow={true}
                            >
                              <div className="flex items-center">
                                <MarketLogos market={m} />
                                <span className="text-th-fgd-2">{m.name}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="mr-3 font-mono text-xs text-th-fgd-2">
                                  {formatCurrencyValue(
                                    m.uiPrice,
                                    getDecimalCount(m.tickSize)
                                  )}
                                </span>
                                {!loadingPerpStats ? (
                                  <Change
                                    change={change}
                                    suffix="%"
                                    size="small"
                                  />
                                ) : (
                                  <SheenLoader className="mt-0.5">
                                    <div className="h-3.5 w-12 bg-th-bkg-2" />
                                  </SheenLoader>
                                )}
                              </div>
                            </Link>
                            <FavoriteMarketButton market={m} />
                          </>
                        ) : (
                          <span className={MARKET_LINK_DISABLED_CLASSES}>
                            <div className="flex items-center">
                              <MarketLogos market={m} />
                              <span className="mr-2">{m.name}</span>
                              <SoonBadge />
                            </div>
                          </span>
                        )}
                      </div>
                    )
                  })
                : null}
              {spotOrPerp === 'spot' && serumMarkets?.length ? (
                <>
                  <div className="mb-3 px-4 md:px-6">
                    {spotBaseTokens.map((tab) => (
                      <button
                        className={`rounded-md py-1.5 px-2.5 text-sm font-medium focus-visible:bg-th-bkg-3 focus-visible:text-th-fgd-1 ${
                          spotBaseFilter === tab
                            ? 'bg-th-bkg-3 text-th-active md:hover:text-th-active'
                            : 'text-th-fgd-3 md:hover:text-th-fgd-2'
                        }`}
                        onClick={() => setSpotBaseFilter(tab)}
                        key={tab}
                      >
                        {t(tab)}
                      </button>
                    ))}
                  </div>
                  {serumMarketsToShow
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
                          className={MARKET_LINK_WRAPPER_CLASSES}
                          key={m.publicKey.toString()}
                        >
                          <Link
                            className={MARKET_LINK_CLASSES}
                            href={{
                              pathname: '/trade',
                              query: { name: m.name },
                            }}
                            onClick={() => {
                              close()
                            }}
                            shallow={true}
                          >
                            <div className="flex items-center">
                              <MarketLogos market={m} />
                              <span className="text-th-fgd-2">{m.name}</span>
                            </div>
                            <div className="flex items-center">
                              {price && market?.tickSize ? (
                                <span className="mr-3 font-mono text-xs text-th-fgd-2">
                                  {quoteBank?.name === 'USDC' ? '$' : ''}
                                  {getDecimalCount(market.tickSize) <= 6
                                    ? formatNumericValue(
                                        price,
                                        getDecimalCount(market.tickSize)
                                      )
                                    : price.toExponential(3)}{' '}
                                  {quoteBank?.name !== 'USDC' ? (
                                    <span className="font-body text-th-fgd-3">
                                      {quoteBank?.name}
                                    </span>
                                  ) : null}
                                </span>
                              ) : null}
                              {!loadingPrices ? (
                                change ? (
                                  <Change
                                    change={change}
                                    suffix="%"
                                    size="small"
                                  />
                                ) : (
                                  <span className="text-th-fgd-3">–</span>
                                )
                              ) : (
                                <SheenLoader className="mt-0.5">
                                  <div className="h-3.5 w-12 bg-th-bkg-2" />
                                </SheenLoader>
                              )}
                            </div>
                          </Link>
                          <FavoriteMarketButton market={m} />
                        </div>
                      )
                    })}
                </>
              ) : null}
            </div>
          </Popover.Panel>
        </div>
      )}
    </Popover>
  )
}

export default MarketSelectDropdown
