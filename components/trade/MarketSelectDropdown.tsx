import FavoriteMarketButton from '@components/shared/FavoriteMarketButton'
import { Popover } from '@headlessui/react'
import {
  ChevronDownIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/20/solid'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  countLeadingZeros,
  floorToDecimal,
  formatCurrencyValue,
  formatNumericValue,
  getDecimalCount,
  numberCompacter,
} from 'utils/numbers'
import MarketLogos from './MarketLogos'
import SoonBadge from '@components/shared/SoonBadge'
import TabButtons from '@components/shared/TabButtons'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
import Loading from '@components/shared/Loading'
import MarketChange from '@components/shared/MarketChange'
import SheenLoader from '@components/shared/SheenLoader'
import useListedMarketsWithMarketData from 'hooks/useListedMarketsWithMarketData'
import {
  AllowedKeys,
  sortPerpMarkets,
  sortSpotMarkets,
  startSearch,
} from 'utils/markets'
import Input from '@components/forms/Input'
import { useSortableData } from 'hooks/useSortableData'
import { SortableColumnHeader } from '@components/shared/TableElements'
import { useViewport } from 'hooks/useViewport'
import { useRouter } from 'next/router'

type Currencies = {
  [key: string]: string
}

export const CURRENCY_SYMBOLS: Currencies = {
  'wBTC (Portal)': '₿',
  SOL: '◎',
}

const MARKET_LINK_CLASSES =
  'grid grid-cols-3 sm:grid-cols-4 flex items-center w-full py-2 px-4 rounded-r-md focus:outline-none focus-visible:text-th-active md:hover:cursor-pointer md:hover:bg-th-bkg-3 md:hover:text-th-fgd-1'

const MARKET_LINK_DISABLED_CLASSES =
  'flex w-full items-center justify-between py-2 px-4 md:hover:cursor-not-allowed'

export const DEFAULT_SORT_KEY: AllowedKeys = 'notionalQuoteVolume'

const MarketSelectDropdown = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { selectedMarket } = useSelectedMarket()
  const [spotOrPerp, setSpotOrPerp] = useState(
    selectedMarket instanceof PerpMarket ? 'perp' : 'spot',
  )
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const { group } = useMangoGroup()
  const [spotBaseFilter, setSpotBaseFilter] = useState('All')
  const { perpMarketsWithData, serumMarketsWithData, isLoading } =
    useListedMarketsWithMarketData()
  const { isDesktop } = useViewport()
  const focusRef = useRef<HTMLInputElement>(null)
  const { query } = useRouter()

  // switch to spot tab on spot markets
  useEffect(() => {
    if (query?.name && !query.name.includes('PERP')) {
      setSpotOrPerp('spot')
    } else {
      setSpotOrPerp('perp')
    }
  }, [query])

  const unsortedPerpMarketsToShow = useMemo(() => {
    if (!perpMarketsWithData.length) return []
    return sortPerpMarkets(perpMarketsWithData, DEFAULT_SORT_KEY)
  }, [perpMarketsWithData])

  const spotQuoteTokens: string[] = useMemo(() => {
    if (serumMarketsWithData.length && group) {
      const quoteTokens: string[] = ['All']
      serumMarketsWithData.map((m) => {
        const quoteBank = group.getFirstBankByTokenIndex(m.quoteTokenIndex)
        const quote = quoteBank.name
        if (!quoteTokens.includes(quote)) {
          quoteTokens.push(quote)
        }
      })
      return quoteTokens.sort((a, b) => a.localeCompare(b))
    }
    return ['All']
  }, [group, serumMarketsWithData])

  const unsortedSerumMarketsToShow = useMemo(() => {
    if (!serumMarketsWithData.length || !group) return []
    if (spotBaseFilter !== 'All') {
      const filteredMarkets = serumMarketsWithData.filter((m) => {
        const quoteBank = group.getFirstBankByTokenIndex(m.quoteTokenIndex)
        const quote = quoteBank.name
        return quote === spotBaseFilter
      })
      return search
        ? startSearch(filteredMarkets, search)
        : sortSpotMarkets(filteredMarkets, DEFAULT_SORT_KEY)
    } else {
      return search
        ? startSearch(serumMarketsWithData, search)
        : sortSpotMarkets(serumMarketsWithData, DEFAULT_SORT_KEY)
    }
  }, [group, search, serumMarketsWithData, spotBaseFilter])

  const handleUpdateSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const {
    items: perpMarketsToShow,
    requestSort: requestPerpSort,
    sortConfig: perpSortConfig,
  } = useSortableData(unsortedPerpMarketsToShow)

  const {
    items: serumMarketsToShow,
    requestSort: requestSerumSort,
    sortConfig: serumSortConfig,
  } = useSortableData(unsortedSerumMarketsToShow)

  useEffect(() => {
    if (focusRef?.current && spotOrPerp === 'spot' && isDesktop && isOpen) {
      focusRef.current.focus()
    }
  }, [focusRef, isDesktop, isOpen, spotOrPerp])

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
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center">
              {selectedMarket ? (
                <MarketLogos market={selectedMarket} />
              ) : (
                <Loading className="mr-2 h-5 w-5 shrink-0" />
              )}
              <div className="whitespace-nowrap text-left text-xl font-bold text-th-fgd-1 md:text-base">
                {selectedMarket?.name || (
                  <span className="text-th-fgd-3">{t('loading')}</span>
                )}
                {selectedMarket?.reduceOnly ? (
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="mr-1 mt-0.5 h-3 w-3 text-th-warning" />
                    <p className="text-xxs leading-none text-th-warning">
                      {t('trade:reduce-only')}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            <ChevronDownIcon
              className={`${
                open ? 'rotate-180' : 'rotate-0'
              } ml-2 mt-0.5 h-6 w-6 shrink-0 text-th-fgd-2`}
            />
          </Popover.Button>
          <Popover.Panel className="absolute -left-4 top-12 z-40 w-screen border-y border-th-bkg-3 bg-th-bkg-2 md:w-[580px] md:border-r">
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
            <div className="thin-scroll h-[calc(100vh-188px)] overflow-auto py-3 md:max-h-[calc(100vh-215px)]">
              {spotOrPerp === 'perp' && perpMarketsToShow.length ? (
                <>
                  <div className="mb-2 grid grid-cols-3 border-b border-th-bkg-3 pb-1 pl-4 pr-14 text-xxs sm:grid-cols-4">
                    <div className="col-span-1 flex-1">
                      <SortableColumnHeader
                        sortKey="name"
                        sort={() => requestPerpSort('name')}
                        sortConfig={perpSortConfig}
                        title={t('market')}
                      />
                    </div>
                    <p className="col-span-1 flex justify-end">
                      <SortableColumnHeader
                        sortKey="marketData.last_price"
                        sort={() => requestPerpSort('marketData.last_price')}
                        sortConfig={perpSortConfig}
                        title={t('price')}
                      />
                    </p>
                    <p className="col-span-1 flex justify-end">
                      <SortableColumnHeader
                        sortKey="rollingChange"
                        sort={() => requestPerpSort('rollingChange')}
                        sortConfig={perpSortConfig}
                        title={t('rolling-change')}
                      />
                    </p>
                    <p className="col-span-1 hidden sm:flex sm:justify-end">
                      <SortableColumnHeader
                        sortKey="marketData.quote_volume_24h"
                        sort={() =>
                          requestPerpSort('marketData.quote_volume_24h')
                        }
                        sortConfig={perpSortConfig}
                        title={t('daily-volume')}
                      />
                    </p>
                  </div>
                  {perpMarketsToShow.map((m) => {
                    const isComingSoon = m.oracleLastUpdatedSlot == 0

                    const volumeData = m?.marketData?.quote_volume_24h

                    const volume = volumeData ? volumeData : 0

                    const leverage = 1 / (m.maintBaseLiabWeight.toNumber() - 1)

                    return (
                      <div className="flex w-full items-center" key={m.name}>
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
                                setSearch('')
                              }}
                              shallow={true}
                            >
                              <div className="col-span-1 flex items-center">
                                <div className="hidden sm:block">
                                  <MarketLogos market={m} size="small" />
                                </div>
                                <span className="mr-1.5 whitespace-nowrap text-xs text-th-fgd-2">
                                  {m.name}
                                </span>
                                {leverage ? (
                                  <LeverageBadge leverage={leverage} />
                                ) : null}
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <span className="font-mono text-xs text-th-fgd-2">
                                  {formatCurrencyValue(
                                    m.uiPrice,
                                    getDecimalCount(m.tickSize),
                                  )}
                                </span>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <MarketChange market={m} size="small" />
                              </div>
                              <div className="col-span-1 hidden sm:flex sm:justify-end">
                                {isLoading ? (
                                  <SheenLoader className="mt-0.5">
                                    <div className="h-3.5 w-12 bg-th-bkg-2" />
                                  </SheenLoader>
                                ) : (
                                  <span>
                                    {volume ? (
                                      <span className="font-mono text-xs text-th-fgd-2">
                                        ${numberCompacter.format(volume)}
                                      </span>
                                    ) : (
                                      <span className="font-mono text-xs text-th-fgd-2">
                                        $0
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </Link>
                            <div className="px-3">
                              <FavoriteMarketButton market={m} />
                            </div>
                          </>
                        ) : (
                          <span className={MARKET_LINK_DISABLED_CLASSES}>
                            <div className="flex items-center">
                              <MarketLogos market={m} size="small" />
                              <span className="mr-2 text-xs">{m.name}</span>
                              <SoonBadge />
                            </div>
                          </span>
                        )}
                      </div>
                    )
                  })}
                </>
              ) : null}
              {spotOrPerp === 'spot' ? (
                <>
                  <div className="mb-3 flex items-center justify-between px-4">
                    <div className="relative w-1/2">
                      <Input
                        className="h-8 pl-8"
                        type="text"
                        value={search}
                        onChange={handleUpdateSearch}
                        ref={focusRef}
                      />
                      <MagnifyingGlassIcon className="absolute left-2 top-2 h-4 w-4" />
                    </div>
                    <div>
                      {spotQuoteTokens.map((tab) => (
                        <button
                          className={`rounded-md px-2.5 py-1.5 text-sm font-medium focus-visible:bg-th-bkg-3 focus-visible:text-th-fgd-1 ${
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
                  </div>
                  <div className="mb-2 grid grid-cols-3 border-b border-th-bkg-3 pb-1 pl-4 pr-14 text-xxs sm:grid-cols-4">
                    <p className="col-span-1 flex">
                      <SortableColumnHeader
                        sortKey="name"
                        sort={() => requestSerumSort('name')}
                        sortConfig={serumSortConfig}
                        title={t('market')}
                      />
                    </p>
                    <p className="col-span-1 flex justify-end">
                      <SortableColumnHeader
                        sortKey="marketData.last_price"
                        sort={() => requestSerumSort('marketData.last_price')}
                        sortConfig={serumSortConfig}
                        title={t('price')}
                      />
                    </p>
                    <p className="col-span-1 flex justify-end">
                      <SortableColumnHeader
                        sortKey="rollingChange"
                        sort={() => requestSerumSort('rollingChange')}
                        sortConfig={serumSortConfig}
                        title={t('rolling-change')}
                      />
                    </p>
                    <p className="col-span-1 hidden sm:flex sm:justify-end">
                      <SortableColumnHeader
                        sortKey="marketData.notionalQuoteVolume"
                        sort={() =>
                          requestSerumSort('marketData.notionalQuoteVolume')
                        }
                        sortConfig={serumSortConfig}
                        title={t('daily-volume')}
                      />
                    </p>
                  </div>
                  {serumMarketsToShow.length ? (
                    serumMarketsToShow.map((m) => {
                      const baseBank = group?.getFirstBankByTokenIndex(
                        m.baseTokenIndex,
                      )
                      const quoteBank = group?.getFirstBankByTokenIndex(
                        m.quoteTokenIndex,
                      )
                      const market = group?.getSerum3ExternalMarket(
                        m.serumMarketExternal,
                      )
                      let leverage
                      if (group) {
                        leverage = m.maxBidLeverage(group)
                      }
                      let price
                      if (baseBank && market && quoteBank) {
                        price = floorToDecimal(
                          baseBank.uiPrice / quoteBank.uiPrice,
                          getDecimalCount(market.tickSize),
                        ).toNumber()
                      }

                      const volumeData = m?.marketData?.quote_volume_24h

                      const volume = volumeData ? volumeData : 0

                      return (
                        <div className="flex w-full items-center" key={m.name}>
                          <Link
                            className={MARKET_LINK_CLASSES}
                            href={{
                              pathname: '/trade',
                              query: { name: m.name },
                            }}
                            onClick={() => {
                              close()
                              setSearch('')
                            }}
                            shallow={true}
                          >
                            <div className="col-span-1 flex items-center">
                              <div className="hidden sm:block">
                                <MarketLogos market={m} size="small" />
                              </div>
                              <span className="mr-1.5 text-xs text-th-fgd-2">
                                {m.name}
                              </span>
                              {leverage ? (
                                <LeverageBadge leverage={leverage} />
                              ) : null}
                            </div>
                            <div className="col-span-1 flex justify-end">
                              {price && market?.tickSize ? (
                                <span className="font-mono text-xs text-th-fgd-2">
                                  {quoteBank?.name === 'USDC' ? '$' : ''}
                                  {countLeadingZeros(price) <= 4
                                    ? formatNumericValue(
                                        price,
                                        getDecimalCount(market.tickSize),
                                      )
                                    : price.toExponential(3)}
                                  {quoteBank?.name &&
                                  quoteBank.name !== 'USDC' ? (
                                    <span className="font-body text-th-fgd-3">
                                      {' '}
                                      {CURRENCY_SYMBOLS[quoteBank.name] ||
                                        quoteBank.name}
                                    </span>
                                  ) : null}
                                </span>
                              ) : null}
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <MarketChange market={m} size="small" />
                            </div>
                            <div className="col-span-1 hidden sm:flex sm:justify-end">
                              {isLoading ? (
                                <SheenLoader className="mt-0.5">
                                  <div className="h-3.5 w-12 bg-th-bkg-2" />
                                </SheenLoader>
                              ) : (
                                <span className="font-mono text-xs text-th-fgd-2">
                                  {quoteBank?.name === 'USDC' ? '$' : ''}
                                  {volume ? numberCompacter.format(volume) : 0}
                                  {quoteBank?.name &&
                                  quoteBank.name !== 'USDC' ? (
                                    <span className="font-body text-th-fgd-3">
                                      {' '}
                                      {CURRENCY_SYMBOLS[quoteBank.name] ||
                                        quoteBank.name}
                                    </span>
                                  ) : null}
                                </span>
                              )}
                            </div>
                          </Link>
                          <div className="px-3">
                            <FavoriteMarketButton market={m} />
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="mb-2 mt-4 text-center">
                      {t('trade:no-markets-found')}
                    </p>
                  )}
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

const LeverageBadge = ({ leverage }: { leverage: number }) => {
  return (
    <div className="rounded border border-th-fgd-4 px-1 py-0.5 text-xxs leading-none text-th-fgd-4">
      <span>{leverage < 1 ? leverage.toFixed(1) : leverage.toFixed()}x</span>
    </div>
  )
}
